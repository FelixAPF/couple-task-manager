package com.couple.taskmanager.service;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.model.*;
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
import org.springframework.security.core.userdetails.UserDetails;
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
    @Autowired
    CTMUserService userService;


    @Override
    public Task get(Long id, Long householdId, CTMUser user) {
        return taskRepository.findByIdAndHouseholdId(id, householdId)
                .orElseThrow(() -> new NoSuchElementException("No task with id " + id));
    }

    @Override
    public List<Task> list(Long householdId, CTMUser user) {
        return taskRepository.findAllByHouseholdId(user.getHousehold().getId());
    }

    public TaskHistoryDto getTaskHistory(Long taskId, CTMUser user){
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new NoSuchElementException("No task with id " + taskId));
        return new TaskHistoryDto(task, StreamUtils.mapToList(taskAssignmentRepository.findAllByTaskIdAndCompletedTrueAndHouseholdId(taskId, user.getHousehold().getId()), TaskAssignmentDto::new));
    }

    public List<TaskAssignmentDto> list(Boolean completed, CTMUser user){
        return StreamUtils.ofNullable(taskAssignmentRepository.findAllByCompletedEqualsAndHouseholdId(completed, user.getHousehold().getId()))
                .map(TaskAssignmentDto::new)
                .toList();
    }

    public List<TaskAssignmentDto> listTaskAssignments(Long taskId, CTMUser user){
        return StreamUtils.ofNullable(taskAssignmentRepository.findAllByTaskIdAndCompletedTrueAndHouseholdId(taskId, user.getHousehold().getId()))
                .map(TaskAssignmentDto::new)
                .toList();
    }

    @Override
    public Task update(Long id, Task task, CTMUser user) {
        if(task.getHousehold() == null){
            task.setHousehold(user.getHousehold());
        }
        return taskRepository.save(task);
    }

    @Override
    @Transactional
    public void delete(Long id, Long householdId, CTMUser user) {
        Optional<Task> taskOptional = taskRepository.findById(id);
        if (taskOptional.isEmpty()) return;
        Task taskToDelete = taskOptional.get();

        // Delete TaskAssignments associated with the Task
        List<TaskAssignment> taskAssignments = taskAssignmentRepository.findAllByTaskIdAndCompletedTrueAndHouseholdId(id, user.getHousehold().getId());
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
        taskRepository.deleteByIdAndHouseholdId(id, user.getHousehold().getId());
    }

    @Override
    public Task create(Task task, CTMUser user) {
        task.setHousehold(user.getHousehold());
        return taskRepository.save(task);
    }

    public Task createRqst(CreateTaskV1 task, CTMUser user) {
        Task savedTask = create(task.getTask(), user);
        if(task.getAssignee() != null){
            taskListService.moveTaskToNewAssignee(savedTask.getId(), task.getAssignee(), user);
        }
        return savedTask;
    }

    public List<TaskPeriod> retrieveTasksByDate(Date date, CTMUser user){
        return taskPeriodRepository.retrieveTasksInPeriod(date, user.getHousehold().getId());
    }

    public List<TaskAssignmentDto> retrieveTaskAssignmentsByDate(Date date, CTMUser user){
        List<TaskAssignment> assignments = taskAssignmentRepository.findAllByCompletedTrueAndCompletedDateSameDayAndHouseholdId(date, user.getHousehold().getId());
        return assignments.stream()
                .map(TaskAssignmentDto::new)
                .toList();
    }

    @Transactional
    public List<TaskAssignment> retrieveIncompleteTasksByAssignee(Assignee assignee, Date date, Frequency frequency, CTMUser user){
        date.setTime(date.getTime() + (long) frequency.getDaysAmount() * 24 * 60 * 60 * 1000);
        List<TaskAssignment> taskAssignments = taskAssignmentRepository.findAllByCompletedFalseAndAssigneeAndDueDateLessThanEqual(assignee, date, user.getHousehold().getId());
        taskAssignments.addAll(taskAssignmentRepository.findAllByCompletedFalseAndAssigneeAndDueDateLessThanEqual(Assignee.Deux, date, user.getHousehold().getId()));
        return taskAssignments;
    }

    public void completeTask(Long assignmentId, CTMUser user) {
        Date completionDate = new Date();
        taskAssignmentRepository.setAssignmentCompleted(assignmentId, true, completionDate);

        TaskPeriod taskPeriod = taskPeriodRepository.findByTaskAssignmentId(assignmentId, user.getHousehold().getId());
        boolean isTaskPeriodCompleted = taskPeriod.getTaskAssignments().stream().allMatch(TaskAssignment::getCompleted);
        if(isTaskPeriodCompleted){
            taskPeriodRepository.markAsCompleted(taskPeriod.getId(), completionDate);
        }
    }

    public Long quickCompleteTask(Long taskId, Assignee assignee, CTMUser user) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(IllegalArgumentException::new);

        Date todayDate = new Date();
        TaskAssignment assignment = new TaskAssignment();
        assignment.setTask(task);
        assignment.setAssignee(assignee);
        assignment.setCreationDate(todayDate);
        assignment.setHousehold(user.getHousehold());
        assignment.setCompletedDate(todayDate);
        assignment.setCompleted(true);
        assignment.setTaskPeriod(null);
        return taskAssignmentRepository.save(assignment).getId();
    }

    public List<TaskWithCompletedDateV1> retrieveTasksNotCompletedInLongTime(CTMUser user) {
        int numberOfMonths = -3;
        Date date = DateUtils.addMonthsToDate(new Date(), numberOfMonths);
        return StreamUtils.ofNullable(taskRepository.retrieveTasksNotCompletedInLongTime(date, user.getHousehold().getId()))
                .map(tuple -> new TaskWithCompletedDateV1(tuple.get(0, Task.class), tuple.get(1, Date.class)))
                .toList();
    }

}
