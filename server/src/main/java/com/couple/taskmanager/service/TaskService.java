package com.couple.taskmanager.service;

import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.model.*;
import com.couple.taskmanager.model.dto.*;
import com.couple.taskmanager.repository.HouseholdRepository;
import com.couple.taskmanager.repository.ProcedureRepository;
import com.couple.taskmanager.repository.TaskHistoryRepository;
import com.couple.taskmanager.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;

@Service
public class TaskService implements IGenericService<Task, TaskDto> {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskHistoryRepository taskHistoryRepository;

    @Autowired
    private ProcedureRepository procedureRepository;

    @Autowired
    private FirebaseMessagingService pushNotificationService;

    @Autowired
    private HouseholdRepository householdRepository;

    @Autowired
    private CTMUserService userService;

    // --- IGenericService Implementation ---

    @Override
    public TaskDto get(Long id, Long householdId, CTMUser user) {
        Task task = taskRepository.findByIdAndHouseholdId(id, householdId)
                .orElseThrow(() -> new NoSuchElementException("No task with id " + id));
        return new TaskDto(task);
    }

    @Transactional
    public void sendThankYou(Long historyId, CTMUser currentUser) {
        TaskHistory history = taskHistoryRepository.findById(historyId)
                .orElseThrow(() -> new NoSuchElementException("History log not found"));

        // Prevent thanking yourself
        if (history.getCompletedBy().getId().equals(currentUser.getId())) return;

        history.setThanked(true);
        history.setThankYouSeen(false);
        taskHistoryRepository.save(history);

        // Fire off the Push Notification!
        String title = "👋 " + currentUser.getName() + " vous remercie !";
        String body = "Merci beaucoup d'avoir fait : " + history.getTask().getTitle();
        pushNotificationService.sendNotificationToUser(history.getCompletedBy(), title, body);
        // Note: adjust the method name above if your PushNotificationService uses a slightly different signature!
    }

    public List<TaskHistoryDto> getUnseenThanks(CTMUser user) {
        return taskHistoryRepository.findByCompletedByIdAndIsThankedTrueAndThankYouSeenFalse(user.getId())
                .stream().map(TaskHistoryDto::new).toList();
    }

    @Transactional
    public void markThanksAsSeen(CTMUser user) {
        List<TaskHistory> unseen = taskHistoryRepository.findByCompletedByIdAndIsThankedTrueAndThankYouSeenFalse(user.getId());
        unseen.forEach(h -> h.setThankYouSeen(true));
        taskHistoryRepository.saveAll(unseen);
    }

    @Override
    public List<TaskDto> list(Long householdId, CTMUser user) {
        return taskRepository.findAllByHouseholdId(householdId).stream().map(TaskDto::new).toList();
    }

    @Override
    public TaskDto update(Long id, Task task, CTMUser user) {
        Task existingTask = taskRepository.findByIdAndHouseholdId(id, user.getHousehold().getId())
                .orElseThrow(() -> new NoSuchElementException("Task not found"));

        existingTask.setTitle(task.getTitle());
        existingTask.setDescription(task.getDescription());
        existingTask.setFrequency(task.getFrequency());
        existingTask.setRoom(task.getRoom());
        return new TaskDto(taskRepository.save(existingTask));
    }

    @Override
    @Transactional
    public void delete(Long id, Long householdId, CTMUser user) {
        Task taskToDelete = taskRepository.findByIdAndHouseholdId(id, householdId)
                .orElseThrow(() -> new NoSuchElementException("Task not found"));

        // Delete history logs before deleting task to prevent foreign key errors
        List<TaskHistory> history = taskHistoryRepository.findByTaskId(id);
        if (!history.isEmpty()) {
            taskHistoryRepository.deleteAll(history);
        }

        taskRepository.delete(taskToDelete);
    }

    @Override
    public TaskDto create(Task task, CTMUser user) {
        task.setHousehold(user.getHousehold());
        if (task.getStartDate() == null) task.setStartDate(new Date());
        if (task.getDueDate() == null) task.setDueDate(new Date());
        return new TaskDto(taskRepository.save(task));
    }

    // --- Custom Logic ---

    public TaskDto createRqst(CreateTaskV1 rqst, CTMUser user) {
        Task task = rqst.getTask();
        if (rqst.getAssigneeUserId() != null) {
            CTMUser assignee = userService.get(rqst.getAssigneeUserId(), user);
            task.setAssignee(assignee);
        }
        if(rqst.getProcedureId() != 0){
            task.setProcedure(procedureRepository.findById(rqst.getProcedureId()).orElse(null));
        }
        return create(task, user);
    }

    public List<TaskDto> getDashboardTasks(String horizon, CTMUser user) {
        Date maxDueDate = calculateMaxDueDateFromHorizon(horizon);

        // Calls an updated strict date-bounded query from the repository
        List<Task> tasks = taskRepository.findDashboardTasksWithHorizon(
                user.getHousehold().getId(), user.getId(), maxDueDate);

        return tasks.stream().map(TaskDto::new).toList();
    }

    public List<TaskHistoryDto> getTodayHistory(CTMUser user) {
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);

        return taskHistoryRepository.findTodayByHousehold(user.getHousehold().getId(), cal.getTime())
                .stream().map(TaskHistoryDto::new).toList();
    }

    @Transactional
    public TaskDto completeTask(Long taskId, CTMUser user) {
        Task task = taskRepository.findByIdAndHouseholdId(taskId, user.getHousehold().getId())
                .orElseThrow(() -> new NoSuchElementException("Task not found"));

        task.setNotified(false);

        taskHistoryRepository.save(new TaskHistory(task, user, new Date()));

        task.setDueDate(calculateNextDueDate(new Date(), task.getFrequency()));
        return new TaskDto(taskRepository.save(task));
    }

    @Scheduled(cron = "0 0 7 * * *", zone = "America/Toronto")
    public void notifyScheduledTaskDue(){
        ZoneId torontoZone = ZoneId.of("America/Toronto");
        ZonedDateTime nowInToronto = ZonedDateTime.now(torontoZone);

        Instant endOfToday = nowInToronto.toLocalDate()
                .atTime(LocalTime.MAX)
                .atZone(torontoZone)
                .toInstant();

        List<Task> allTaskDue = taskRepository.findAllTaskDue(endOfToday);
        allTaskDue.forEach((task) -> {
            String title = "Tâche due aujourd'hui";
            String description = "N'oubliez pas de faire " + task.getTitle() + " aujourd'hui";
            boolean isAssigned = task.getAssignee() != null;
            List<CTMUser> assignedUsers = isAssigned ? Collections.singletonList(task.getAssignee()) : householdRepository.findUsersByHouseholdId(task.getHousehold().getId());
            Household byId = householdRepository.findById(task.getHousehold().getId()).orElse(null);
            if (byId == null) return;
            if(isAssigned){
                System.out.println("PUSHING TO single user" + task.getAssignee().getName());
                pushNotificationService.sendNotificationToUser(task.getAssignee(),title,description);
            } else {
                System.out.println("pushing to multiple users " + byId.getUsers().size());
                byId.getUsers().forEach((user -> pushNotificationService.sendNotificationToUser(user, title, description)));
            }
        });
    }

    @Transactional
    public TaskDto skipTask(Long taskId, CTMUser user) {
        Task task = taskRepository.findByIdAndHouseholdId(taskId, user.getHousehold().getId())
                .orElseThrow(() -> new NoSuchElementException("Task not found"));

        // Changed task.getDueDate() to new Date() right here!
        task.setDueDate(calculateNextDueDate(new Date(), task.getFrequency()));
        return new TaskDto(taskRepository.save(task));
    }

    @Transactional
    public TaskDto rescheduleTask(Long taskId, Date newDueDate, CTMUser user) {
        Task task = taskRepository.findByIdAndHouseholdId(taskId, user.getHousehold().getId())
                .orElseThrow(() -> new NoSuchElementException("Task not found"));

        task.setDueDate(newDueDate);
        return new TaskDto(taskRepository.save(task));
    }

    private Date calculateNextDueDate(Date baseDate, Frequency frequency) {
        long millisToAdd = (long) frequency.getDaysAmount() * 24 * 60 * 60 * 1000;
        return new Date(baseDate.getTime() + millisToAdd);
    }

    public List<TaskHistoryDto> getTaskHistory(Long taskId, CTMUser user) {
        // Verify the task belongs to the household for security
        Task task = taskRepository.findByIdAndHouseholdId(taskId, user.getHousehold().getId())
                .orElseThrow(() -> new NoSuchElementException("Task not found"));

        List<TaskHistory> historyList = taskHistoryRepository.findByTaskId(taskId);

        // Convert to DTOs and sort by newest first
        return historyList.stream()
                .map(TaskHistoryDto::new)
                .sorted((a, b) -> b.getCompletedDate().compareTo(a.getCompletedDate()))
                .toList();
    }

    private Date calculateMaxDueDateFromHorizon(String horizon) {
        long now = System.currentTimeMillis();
        long dayMillis = 24L * 60 * 60 * 1000;

        switch (horizon.toUpperCase()) {
            case "WEEK":
                return new Date(now + 7 * dayMillis);
            case "BIWEEKLY":
                return new Date(now + 14 * dayMillis);
            case "MONTH":
                return new Date(now + 30 * dayMillis);
            case "QUARTER":
                return new Date(now + 90 * dayMillis);
            case "HALFYEAR":
                return new Date(now + 182 * dayMillis);
            case "YEAR":
            default:
                return new Date(now + 365 * dayMillis);
        }
    }
}