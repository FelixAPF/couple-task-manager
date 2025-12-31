package com.couple.taskmanager.service;

import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.model.*;
import com.couple.taskmanager.model.dto.*;
import com.couple.taskmanager.repository.ITaskPeriodRepository;
import com.couple.taskmanager.repository.TaskAssignmentRepository;
import com.couple.taskmanager.repository.TaskListRepository;
import com.couple.taskmanager.repository.TaskRepository;
import com.couple.taskmanager.utils.DateUtils;
import com.couple.taskmanager.utils.StreamUtils;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class TaskService implements IGenericService<Task, TaskDto > {
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

    @PersistenceContext
    private EntityManager entityManager;


    @Override
    public TaskDto get(Long id, Long householdId, CTMUser user) {
        Task task = taskRepository.findByIdAndHouseholdId(id, householdId)
                .orElseThrow(() -> new NoSuchElementException("No task with id " + id));
        return new TaskDto(task);
    }

    @Override
    public List<TaskDto> list(Long householdId, CTMUser user) {
        return taskRepository.findAllByHouseholdId(user.getHousehold().getId()).stream().map(TaskDto::new).toList();
    }

    public TaskHistoryDto getTaskHistory(Long taskId, CTMUser user){
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new NoSuchElementException("No task with id " + taskId));
        TaskDto taskDto = new TaskDto(task);
        return new TaskHistoryDto(taskDto, StreamUtils.mapToList(taskAssignmentRepository.findAllByTaskIdAndCompletedTrueAndHouseholdId(taskId, user.getHousehold().getId()), TaskAssignmentDto::new));
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
    public TaskDto update(Long id, Task task, CTMUser user) {
        Task existingTask = taskRepository.findByIdAndHouseholdId(id, user.getHousehold().getId())
                .orElseThrow(() -> new NoSuchElementException("Task not found or does not belong to your household"));

        // Update fields
        existingTask.setTitle(task.getTitle());
        existingTask.setDescription(task.getDescription());
        existingTask.setFrequency(task.getFrequency());
        existingTask.setRoom(task.getRoom());

        // Ensure household is kept (security)
        existingTask.setHousehold(user.getHousehold());

        return new TaskDto(taskRepository.save(existingTask));
    }

    @Override
    @Transactional
    public void delete(Long id, Long householdId, CTMUser user) {
        Optional<Task> taskOptional = taskRepository.findById(id);
        if (taskOptional.isEmpty()) return;
        Task taskToDelete = taskOptional.get();
        if(!Objects.equals(taskToDelete.getHousehold().getId(), householdId)) throw new IllegalArgumentException("This is not your household");

        try {
            entityManager.createNativeQuery("DELETE FROM task_list_tasks WHERE tasks_id = :id")
                    .setParameter("id", id)
                    .executeUpdate();
        } catch (Exception e) {

        }

        // 2. Clear the Managed Relationship (task_tasklist) via JPA
        for (TaskList taskList : taskToDelete.getTaskLists()) {
            taskList.getTasks().remove(taskToDelete);
            taskListRepository.save(taskList);
        }
        taskToDelete.getTaskLists().clear();
        taskRepository.save(taskToDelete);

        // 3. Delete the Task
        taskRepository.delete(taskToDelete);
    }

    @Override
    public TaskDto create(Task task, CTMUser user) {
        task.setHousehold(user.getHousehold());
        return new TaskDto(taskRepository.save(task));
    }

    public TaskDto createRqst(CreateTaskV1 task, CTMUser user) {
        TaskDto savedTask = create(task.getTask(), user);
        if(task.getAssigneeUserId() != null){
            taskListService.moveTaskToNewAssignee(savedTask.getId(), task.getAssigneeUserId(), user);
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
    public List<TaskAssignment> retrieveIncompleteTasksByAssignee(Long assignedUserId, Date date, Frequency frequency, CTMUser user){
        date.setTime(date.getTime() + (long) frequency.getDaysAmount() * 24 * 60 * 60 * 1000);
        List<TaskAssignment> taskAssignments = taskAssignmentRepository.findAllByCompletedFalseAndAssigneeAndDueDateLessThanEqual(assignedUserId, date, user.getHousehold().getId());
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

    public Long quickCompleteTask(Long taskId, Long assigneeUserId, CTMUser user) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(IllegalArgumentException::new);
        CTMUser assignee = userService.get(assigneeUserId, user);

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

    public List<TaskWithCompletedDateV1> retrieveTasksNotCompletedInLongTime(com.couple.taskmanager.model.CTMUser user) {
        int numberOfMonths = -3;
        Date date = DateUtils.addMonthsToDate(new Date(), numberOfMonths);
        return StreamUtils.ofNullable(taskRepository.retrieveTasksNotCompletedInLongTime(date, user.getHousehold().getId()))
                .map(tuple -> {
                    Task taskEntity = tuple.get(0, Task.class);
                    Date completedDate = tuple.get(1, Date.class);
                    TaskDto dto =  new TaskDto(taskEntity);
                    return new TaskWithCompletedDateV1(dto, completedDate);
                })
                .toList();

    }

}
