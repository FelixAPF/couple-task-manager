package com.couple.taskmanager.service;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.enums.Room;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskAssignment;
import com.couple.taskmanager.model.TaskList;
import com.couple.taskmanager.model.TaskPeriod;
import com.couple.taskmanager.model.dto.CreateTaskV1;
import com.couple.taskmanager.model.dto.TaskAssignmentDto;
import com.couple.taskmanager.model.dto.TaskHistoryDto;
import com.couple.taskmanager.model.dto.TaskWithCompletedDateV1;
import com.couple.taskmanager.repository.ITaskPeriodRepository;
import com.couple.taskmanager.repository.TaskAssignmentRepository;
import com.couple.taskmanager.repository.TaskListRepository;
import com.couple.taskmanager.repository.TaskRepository;
import com.couple.taskmanager.utils.DateUtils;
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class TaskService implements IGenericService<Task> {
    @Autowired
    TaskRepository taskRepository;
    @Autowired
    ITaskPeriodRepository taskPeriodRepository;
    @Autowired
    TaskAssignmentRepository taskAssignmentRepository;
    @Autowired
    TaskListRepository taskListRepository;
    @Autowired
    TaskListService taskListService;


    @Override
    public Task get(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No task with id " + id));
    }

    @Override
    public List<Task> list() {
        return taskRepository.findAll();
    }

    public TaskHistoryDto getTaskHistory(Long taskId){
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new NoSuchElementException("No task with id " + taskId));
        return new TaskHistoryDto(task, StreamUtils.mapToList(taskAssignmentRepository.findAllByTaskIdAndCompletedTrue(taskId), TaskAssignmentDto::new));
    }

    public List<TaskAssignmentDto> list(Boolean completed){
        return StreamUtils.ofNullable(taskAssignmentRepository.findAllByCompletedEquals(completed))
                .map(TaskAssignmentDto::new)
                .toList();
    }

    public List<TaskAssignmentDto> list(Long taskId){
        return StreamUtils.ofNullable(taskAssignmentRepository.findAllByTaskIdAndCompletedTrue(taskId))
                .map(TaskAssignmentDto::new)
                .toList();
    }

    @Override
    public Task update(Long id, Task task) {
        return taskRepository.save(task);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Optional<Task> taskOptional = taskRepository.findById(id);
        if (taskOptional.isEmpty()) return;
        Task taskToDelete = taskOptional.get();

        // Delete TaskAssignments associated with the Task
        List<TaskAssignment> taskAssignments = taskAssignmentRepository.findAllByTaskIdAndCompletedTrue(id);
        taskAssignmentRepository.deleteAll(taskAssignments);

        // Remove the Task from TaskLists
        List<TaskList> taskLists = taskListRepository.findAll();
        for (TaskList taskList : taskLists) {
            if (taskList.getTasks().contains(taskToDelete)) {
                taskList.getTasks().remove(taskToDelete);
                taskListRepository.save(taskList);
            }
        }

        // Finally, delete the Task
        taskRepository.deleteById(id);
    }

    @Override
    public Task create(Task task) {
        return taskRepository.save(task);
    }

    public Task createRqst(CreateTaskV1 task) {
        Task savedTask = create(task.getTask());
        if(task.getAssignee() != null){
            taskListService.moveTaskToNewAssignee(savedTask.getId(), task.getAssignee());
        }
        return savedTask;
    }

    public List<TaskPeriod> retrieveTasksByDate(Date date){
        return taskPeriodRepository.retrieveTasksInPeriod(date);
    }

    public List<TaskAssignmentDto> retrieveTaskAssignmentsByDate(Date date){
        List<TaskAssignment> assignments = taskAssignmentRepository.findAllByCompletedTrueAndCompletedDateSameDay(date);
        return assignments.stream()
                .map(TaskAssignmentDto::new)
                .toList();
    }

    @Transactional
    public List<TaskAssignment> retrieveIncompleteTasksByAssignee(Assignee assignee, Date date, Frequency frequency){
        date.setTime(date.getTime() + (long) frequency.getDaysAmount() * 24 * 60 * 60 * 1000);
        List<TaskAssignment> taskAssignments = taskAssignmentRepository.findAllByCompletedFalseAndAssigneeAndDueDateLessThanEqual(assignee, date);
        taskAssignments.addAll(taskAssignmentRepository.findAllByCompletedFalseAndAssigneeAndDueDateLessThanEqual(Assignee.Deux, date));
        return taskAssignments;
    }

    public void completeTask(Long assignmentId) {
        Date completionDate = new Date();
        taskAssignmentRepository.setAssignmentCompleted(assignmentId, true, completionDate);

        TaskPeriod taskPeriod = taskPeriodRepository.findByTaskAssignmentId(assignmentId);
        boolean isTaskPeriodCompleted = taskPeriod.getTaskAssignments().stream().allMatch(TaskAssignment::getCompleted);
        if(isTaskPeriodCompleted){
            taskPeriodRepository.markAsCompleted(taskPeriod.getId(), completionDate);
        }
    }

    public Long quickCompleteTask(Long taskId, Assignee assignee) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(IllegalArgumentException::new);

        Date todayDate = new Date();
        TaskAssignment assignment = new TaskAssignment();
        assignment.setTask(task);
        assignment.setAssignee(assignee);
        assignment.setCreationDate(todayDate);
        assignment.setCompletedDate(todayDate);
        assignment.setCompleted(true);
        assignment.setTaskPeriod(null);
        return taskAssignmentRepository.save(assignment).getId();
    }

    public List<TaskWithCompletedDateV1> retrieveTasksNotCompletedInLongTime() {
        int numberOfMonths = -3;
        Date date = DateUtils.addMonthsToDate(new Date(), numberOfMonths);
        return StreamUtils.ofNullable(taskRepository.retrieveTasksNotCompletedInLongTime(date))
                .map(tuple -> new TaskWithCompletedDateV1(tuple.get(0, Task.class), tuple.get(1, Date.class)))
                .toList();
    }

}
