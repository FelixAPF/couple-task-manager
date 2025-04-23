package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskList;
import com.couple.taskmanager.model.dto.BasicTaskAssignmentRqstV1;
import com.couple.taskmanager.model.dto.TaskListDto;
import com.couple.taskmanager.model.dto.TaskListRequestV1;
import com.couple.taskmanager.repository.HouseholdRepository;
import com.couple.taskmanager.repository.TaskListRepository;
import com.couple.taskmanager.repository.TaskRepository;
import com.couple.taskmanager.utils.StreamUtils;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.SystemException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class TaskListService implements IGenericService<TaskList, TaskListDto> {
    @Autowired
    TaskListRepository taskListRepository;
    @Autowired
    TaskRepository taskRepository;
    @Autowired
    HouseholdRepository householdRepository;


    @Override
    public TaskListDto get(Long id, Long householdId, CTMUser user) {
        throw new IllegalArgumentException();
    }

    public List<TaskListDto> get(Long assigneeUserId, CTMUser user) {
        List<TaskList> taskLists = new ArrayList<>();
        taskListRepository.findByAssignee(assigneeUserId, user.getHousehold().getId()).ifPresent(taskLists::add);
        //TODO: Integrate ALL to assignees
        //taskLists.add(taskListRepository.findByAssignee(Assignee.Deux, user.getHousehold().getId()));
        return taskLists.stream().map(TaskListDto::new).toList();
    }

    @Override
    public List<TaskListDto> list(Long householdId, CTMUser user) {
        return taskListRepository.findAllByHouseholdId(householdId).stream().map(TaskListDto::new).toList();
    }

    @PostConstruct
    public void init(){

    }

    public List<TaskListDto> listWithUnassigned(CTMUser user){
        List<TaskList> taskLists = taskListRepository.findAllByHouseholdId(user.getHousehold().getId());
        List<Task> tasks = taskRepository.findAllByHouseholdId(user.getHousehold().getId());
        TaskList unassignedTaskList = new TaskList();
        List<Long> assignedTaskIds = StreamUtils.ofNullable(taskLists)
                .flatMap(taskList -> StreamUtils.ofNullable(taskList.getTasks()).map(Task::getId))
                .toList();
        for(Task task : tasks){
            if(!assignedTaskIds.contains(task.getId())){
                unassignedTaskList.getTasks().add(task);
            }
        }
        taskLists.add(unassignedTaskList);
        return taskLists.stream().map(TaskListDto::new).toList();
    }

    @Transactional // Add this annotation for atomicity
    public void moveTaskToNewAssignee(Long taskId, Long assigneeUserId, CTMUser user){
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NoSuchElementException("No task with id " + taskId));

        TaskList sourceList = taskListRepository.findByTaskId(taskId, user.getHousehold().getId());

        TaskList targetList = taskListRepository.findByAssignee(assigneeUserId, user.getHousehold().getId()).orElse(null);
        if(targetList == null) {
            throw new IllegalStateException("Target TaskList for assignee " + assigneeUserId + " not found.");
        }

        if (sourceList != null && sourceList.getId().equals(targetList.getId())) {
            System.out.println("Task " + taskId + " is already assigned to ");
            return; // No changes needed
        }

        List<TaskList> listsToSave = new ArrayList<>();

        if(sourceList != null) {
            boolean removed = sourceList.getTasks().remove(task);
            if (removed) {
                listsToSave.add(sourceList);
            } else {
                System.err.println("Warning: Task " + taskId + " found in list " + sourceList.getId() + " via query, but not in its loaded tasks collection.");
            }
        }

        if (!targetList.getTasks().contains(task)) {
            targetList.getTasks().add(task);
            // Add targetList to save list *only if* it wasn't already added as the sourceList
            if (!listsToSave.contains(targetList)) {
                listsToSave.add(targetList);
            }
        }

        if (!listsToSave.isEmpty()) {
            taskListRepository.saveAll(listsToSave); // Save all modified lists together
        }
    }


    @Override
    public TaskListDto update(Long id, TaskList taskList, CTMUser user) {
        return null;
    }

    @Override
    @Transactional
    public void delete(Long id, Long householdId, CTMUser user) {
        taskListRepository.deleteById(id);
    }

    @Transactional
    public TaskListDto unassign(TaskListRequestV1 rqst) {
        TaskList taskList = taskListRepository.findById(rqst.getTaskListId()).orElseThrow(() -> new NoSuchElementException("Task List does not exist " + rqst.getTaskListId()));

        List<Task> tasks = StreamUtils.ofNullable(taskList.getTasks())
                .filter(task -> !task.getId().equals(rqst.getTaskId()))
                .toList();

        taskList.setTasks(new ArrayList<>(tasks));
        return new TaskListDto(taskListRepository.save(taskList));
    }

    @Override
    public TaskListDto create(TaskList taskList, CTMUser user) {
        if(taskList.getHousehold() == null){
            taskList.setHousehold(user.getHousehold());
        }
        return new TaskListDto(taskListRepository.save(taskList));
    }

    public void addTasksToExistingList(List<BasicTaskAssignmentRqstV1> taskWithIds, CTMUser user) throws SystemException {
        Household household = householdRepository.findByIdWithUsers(user.getHousehold().getId())
                .orElseThrow(() -> new SystemException("Household not found for user")); // More specific exception

        Map<String, List<Long>> assigneeTasks = new HashMap<>();
        // Ensure users list is not null before streaming
        if (household.getUsers() != null) {
            for(CTMUser u : household.getUsers()){
                // Use user ID directly as key
                assigneeTasks.put(u.getId().toString(), new ArrayList<>());
            }
        } else {
            throw new SystemException("Household has no associated users.");
        }


        for(BasicTaskAssignmentRqstV1 rqst : taskWithIds){
            // Ensure assigneeUserId is not null
            if (rqst.getAssigneeUserId() != null) {
                List<Long> value = assigneeTasks.get(rqst.getAssigneeUserId().toString());
                if(value != null && rqst.getTaskId() != null){ // Ensure taskId is not null
                    value.add(rqst.getTaskId());
                } else if (value == null) {
                    System.err.println("Warning: Assignee User ID " + rqst.getAssigneeUserId() + " from request not found in household users.");
                }
            } else {
                System.err.println("Warning: Request contains null assigneeUserId for task " + rqst.getTaskId());
            }
        }

        List<TaskList> toUpdateTaskLists = new ArrayList<>();
        for(String assigneeIdStr : assigneeTasks.keySet()){
            Long assigneeId = Long.valueOf(assigneeIdStr);
            List<Long> taskIdsForAssignee = assigneeTasks.get(assigneeIdStr);

            // --- Use the corrected repository method ---
            TaskList existingTaskList = taskListRepository.findByAssignee(assigneeId, user.getHousehold().getId())
                    .orElseGet(() -> {
                        // Create new TaskList if not found
                        TaskList newList = new TaskList();
                        // Find the user object again (necessary if creating new)
                        CTMUser assigneeUser = household.getUsers().stream()
                                .filter(u -> u.getId().equals(assigneeId))
                                .findFirst()
                                // Use a more appropriate exception or handling
                                .orElseThrow(() -> new RuntimeException("Assignee user " + assigneeId + " not found in household object unexpectedly."));
                        newList.setUser(assigneeUser);
                        newList.setHousehold(user.getHousehold());
                        // Initialize tasks list if using @NonNull or similar
                        // newList.setTasks(new ArrayList<>()); // Already done by @NonNull default
                        return newList; // Return the newly created list
                    });

            // Fetch the actual Task entities
            // Only fetch if there are IDs to fetch
            List<Task> newTasks = taskIdsForAssignee.isEmpty()
                    ? new ArrayList<>()
                    : taskRepository.findAllById(taskIdsForAssignee);

            // *** Important Logic Check: ***
            // This line REPLACES all existing tasks. Is that intended?
            // If you want to ADD tasks, you should do: existingTaskList.getTasks().addAll(newTasks);
            // Make sure to handle potential duplicates if adding.
            existingTaskList.setTasks(new ArrayList<>(newTasks)); // Use new ArrayList to be safe if original list was immutable

            toUpdateTaskLists.add(existingTaskList);
        }

        if (!toUpdateTaskLists.isEmpty()) {
            taskListRepository.saveAllAndFlush(toUpdateTaskLists);
        }
    }
}
