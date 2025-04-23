package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskList;
import com.couple.taskmanager.model.dto.BasicTaskAssignmentRqstV1;
import com.couple.taskmanager.model.dto.TaskListDto;
import com.couple.taskmanager.model.dto.TaskListRequestV1;
import com.couple.taskmanager.repository.CTMUserRepository;
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
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class TaskListService implements IGenericService<TaskList, TaskListDto> {
    @Autowired
    TaskListRepository taskListRepository;
    @Autowired
    TaskRepository taskRepository;
    @Autowired
    HouseholdRepository householdRepository;
    @Autowired
    CTMUserRepository userRepository;


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
    public void moveTaskToNewAssignee(Long taskId, Long userId, CTMUser user){
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new NoSuchElementException("No task with id " + taskId));
        CTMUser newUser = userRepository.findById(userId).orElseThrow(() -> new NoSuchElementException("No user with id " + userId));
        Household household = householdRepository.findByIdWithUsers(user.getHousehold().getId()).orElseThrow(()->new NoSuchElementException("No household with id " + user.getHousehold().getId()));

        //Remove Task from old list.
        TaskList currentList = taskListRepository.findByAssignee(task.getTaskLists().stream().findFirst().orElseThrow(NoSuchElementException::new).getUser().getId(), user.getHousehold().getId()).orElseThrow(()-> new NoSuchElementException("No list for current user."));
        currentList.getTasks().remove(task);
        taskListRepository.save(currentList);

        //Add Task to new list
        TaskList newList = taskListRepository.findByAssignee(newUser.getId(), user.getHousehold().getId()).orElseGet(()->{
            TaskList newTaskList = new TaskList();
            newTaskList.setUser(newUser);
            newTaskList.setHousehold(household);
            return taskListRepository.save(newTaskList);
        });

        if(!newList.getTasks().contains(task)) newList.getTasks().add(task);
        if(!task.getTaskLists().contains(newList)) task.getTaskLists().add(newList);

        taskListRepository.save(newList);
        taskRepository.save(task);
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

    @Transactional
    public void addTasksToExistingList(List<BasicTaskAssignmentRqstV1> taskWithIds, CTMUser user) throws SystemException {
        Household household = householdRepository.findByIdWithUsers(user.getHousehold().getId())
                .orElseThrow(() -> new SystemException("Household not found for user"));

        // --- 1. Prepare Data Structures ---

        // Map all users in the household by their ID for quick lookup
        Map<Long, CTMUser> householdUsersMap = household.getUsers().stream()
                .collect(Collectors.toMap(CTMUser::getId, Function.identity()));

        // Map existing or new TaskLists by User ID for the household
        Map<Long, TaskList> taskListMap = household.getUsers().stream()
                .map(u -> taskListRepository.findByAssignee(u.getId(), household.getId())
                        .orElseGet(() -> {
                            TaskList newTaskList = new TaskList();
                            newTaskList.setUser(u);
                            newTaskList.setHousehold(household);
                            // Don't save yet, will be saved later if needed
                            return newTaskList;
                        }))
                .collect(Collectors.toMap(tl -> tl.getUser().getId(), Function.identity()));

        // Group the input assignments by Task ID
        Map<Long, List<BasicTaskAssignmentRqstV1>> assignmentsByTaskId = taskWithIds.stream()
                .filter(rqst -> rqst.getTaskId() != null && rqst.getAssigneeUserId() != null)
                .collect(Collectors.groupingBy(BasicTaskAssignmentRqstV1::getTaskId));

        // Get all Task IDs mentioned in the input
        Set<Long> taskIdsInRequest = assignmentsByTaskId.keySet();

        // Fetch all relevant Task entities from the database that belong to this household
        Map<Long, Task> taskMap = taskRepository.findAllById(taskIdsInRequest).stream()
                .filter(task -> task.getHousehold().getId().equals(household.getId())) // Ensure tasks are in the correct household
                .collect(Collectors.toMap(Task::getId, Function.identity()));

        // --- 2. Process Each Task from the Input ---
        Set<Task> tasksToSave = new HashSet<>();
        Set<TaskList> taskListsToSave = new HashSet<>();

        for (Long taskId : taskIdsInRequest) {
            Task task = taskMap.get(taskId);
            if (task == null) {
                System.err.println("Warning: Task ID " + taskId + " from request not found in household or database.");
                continue; // Skip tasks not found or not in this household
            }

            // Determine the target TaskLists for this specific task based on the input
            Set<TaskList> targetTaskLists = new HashSet<>();
            List<BasicTaskAssignmentRqstV1> assignmentsForThisTask = assignmentsByTaskId.get(taskId);

            boolean assignToAll = assignmentsForThisTask.stream()
                    .anyMatch(a -> a.getAssigneeUserId() == 0);

            if (assignToAll) {
                // If assigneeUserId 0 is present, assign to all TaskLists in the household
                targetTaskLists.addAll(taskListMap.values());
            } else {
                // Assign only to specifically mentioned users
                for (BasicTaskAssignmentRqstV1 assignment : assignmentsForThisTask) {
                    Long specificUserId = assignment.getAssigneeUserId();
                    if (householdUsersMap.containsKey(specificUserId)) { // Check if user exists in household
                        TaskList specificList = taskListMap.get(specificUserId);
                        if (specificList != null) { // Should always be non-null due to pre-population
                            targetTaskLists.add(specificList);
                        } else {
                            System.err.println("Warning: TaskList for user ID " + specificUserId + " unexpectedly not found.");
                        }
                    } else {
                        System.err.println("Warning: Assignee User ID " + specificUserId + " for task " + taskId + " not found in household.");
                    }
                }
            }

            // --- 3. Synchronize the Task's Associations ---
            Set<TaskList> currentTaskLists = new HashSet<>(task.getTaskLists());

            // Remove task from lists it should no longer be in
            Set<TaskList> listsToRemoveFrom = new HashSet<>(currentTaskLists);
            listsToRemoveFrom.removeAll(targetTaskLists);
            for (TaskList listToRemove : listsToRemoveFrom) {
                listToRemove.getTasks().remove(task);
                taskListsToSave.add(listToRemove); // Mark TaskList for saving
            }

            // Add task to lists it should now be in
            Set<TaskList> listsToAddTo = new HashSet<>(targetTaskLists);
            listsToAddTo.removeAll(currentTaskLists);
            for (TaskList listToAdd : listsToAddTo) {
                listToAdd.getTasks().add(task);
                taskListsToSave.add(listToAdd); // Mark TaskList for saving
            }

            // Update the task's side of the relationship
            task.setTaskLists(new ArrayList<>(targetTaskLists));
            tasksToSave.add(task); // Mark Task for saving
        }

        // --- 4. Handle Tasks NOT in the Request (Implicit Removal) ---
        // Find tasks currently in any household TaskList but NOT mentioned in the input request.
        // These need to be removed from all lists they are currently in.
        Set<Long> tasksCurrentlyInAnyList = taskListMap.values().stream()
                .flatMap(tl -> tl.getTasks().stream())
                .map(Task::getId)
                .collect(Collectors.toSet());

        Set<Long> taskIdsToRemoveCompletely = new HashSet<>(tasksCurrentlyInAnyList);
        taskIdsToRemoveCompletely.removeAll(taskIdsInRequest); // Keep only those NOT in the request

        if (!taskIdsToRemoveCompletely.isEmpty()) {
            List<Task> tasksToClear = taskRepository.findAllById(taskIdsToRemoveCompletely);
            for (Task taskToClear : tasksToClear) {
                if (!taskToClear.getHousehold().getId().equals(household.getId())) continue; // Skip if somehow from wrong household

                // Remove this task from every TaskList it's currently associated with
                List<TaskList> listsContainingTask = new ArrayList<>(taskToClear.getTaskLists()); // Copy to avoid concurrent modification
                for (TaskList list : listsContainingTask) {
                    list.getTasks().remove(taskToClear);
                    taskListsToSave.add(list); // Mark TaskList for saving
                }
                taskToClear.getTaskLists().clear(); // Clear the task's side
                tasksToSave.add(taskToClear); // Mark Task for saving
            }
        }


        // --- 5. Save Changes ---
        if (!taskListsToSave.isEmpty()) {
            taskListRepository.saveAll(taskListsToSave);
        }
        if (!tasksToSave.isEmpty()) {
            taskRepository.saveAll(tasksToSave);
        }
    }

}
