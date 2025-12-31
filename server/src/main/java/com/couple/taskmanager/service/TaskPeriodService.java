package com.couple.taskmanager.service;

import com.couple.taskmanager.enums.CreationMethod; // Added missing import
import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.model.*;
import com.couple.taskmanager.model.dto.BasicTaskAssignmentRqstV1;
import com.couple.taskmanager.model.dto.PeriodCreationRqstV1;
import com.couple.taskmanager.model.dto.TaskListOccasionDto;
import com.couple.taskmanager.model.dto.TaskPeriodDto;
import com.couple.taskmanager.repository.*;
import com.couple.taskmanager.utils.DateUtils;
import com.couple.taskmanager.utils.StreamUtils;
import jakarta.transaction.SystemException;
import org.slf4j.Logger; // Import Logger
import org.slf4j.LoggerFactory; // Import LoggerFactory
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class TaskPeriodService implements IGenericService<TaskPeriod, TaskPeriodDto> {

    // Logger for better error reporting
    private static final Logger log = LoggerFactory.getLogger(TaskPeriodService.class);

    @Autowired
    ITaskPeriodRepository taskPeriodRepository;
    @Autowired
    TaskRepository taskRepository;
    @Autowired
    TaskAssignmentRepository taskAssignmentRepository;
    @Autowired
    TaskListRepository taskListRepository;
    @Autowired
    CTMUserRepository userRepository;
    @Autowired
    HouseholdRepository householdRepository;
    @Autowired
    TaskListOccasionService occasionService;

    // --- Standard CRUD and List Methods ---

    @Override
    public TaskPeriodDto get(Long id, Long householdId, CTMUser user) {
        TaskPeriod period = taskPeriodRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No task period with id " + id));
        // Verify household access using the user's household
        if (!period.getHousehold().getId().equals(user.getHousehold().getId())) {
            log.warn("User {} attempted to access period {} belonging to another household.", user.getId(), id);
            throw new SecurityException("Access denied to task period " + id);
        }
        return new TaskPeriodDto(period);
    }

    @Override
    public List<TaskPeriodDto> list(Long householdId, CTMUser user) {
        // List periods belonging to the user's household
        return StreamUtils.mapToList(taskPeriodRepository.findAllByHouseholdId(user.getHousehold().getId()), TaskPeriodDto::new);
    }

    public List<TaskPeriodDto> listIncomplete(CTMUser user) {
        // List incomplete periods belonging to the user's household
        return StreamUtils.mapToList(taskPeriodRepository.findByCompletedFalse(user.getHousehold().getId()), TaskPeriodDto::new);
    }

    @Override
    public TaskPeriodDto update(Long id, TaskPeriod taskPeriod, CTMUser user) {
        // This generic update might be too broad. Consider specific update operations.
        log.warn("Generic update(Long, TaskPeriod, CTMUser) called for period {}. Consider using more specific update methods.", id);
        // Fetch existing to ensure it belongs to the user's household before updating
        TaskPeriod existingPeriod = taskPeriodRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No task period with id " + id));
        if (!existingPeriod.getHousehold().getId().equals(user.getHousehold().getId())) {
            log.warn("User {} attempted to update period {} belonging to another household.", user.getId(), id);
            throw new SecurityException("Access denied to update task period " + id);
        }
        // Apply updates from taskPeriod to existingPeriod (be careful with relationships)
        existingPeriod.setStartDate(taskPeriod.getStartDate());
        existingPeriod.setEndDate(taskPeriod.getEndDate());
        existingPeriod.setCompleted(taskPeriod.getCompleted());
        // Add more fields as needed
        return new TaskPeriodDto(taskPeriodRepository.save(existingPeriod));
        // throw new UnsupportedOperationException("Use specific update methods or createPeriod with existing periodId.");
    }

    /**
     * Updates an existing TaskPeriod by adding new TaskAssignments.
     * Ensures assignments belong to the correct household.
     *
     * @param taskPeriod        The existing TaskPeriod entity (must have an ID).
     * @param newTaskAssignments The list of new TaskAssignments to add.
     * @return TaskPeriodDto representing the updated period.
     */
    @Transactional
    public TaskPeriodDto update(TaskPeriod taskPeriod, List<TaskAssignment> newTaskAssignments) {
        if (taskPeriod == null || taskPeriod.getId() == null) {
            throw new IllegalArgumentException("TaskPeriod must be an existing entity (with ID) for update.");
        }
        if (newTaskAssignments == null || newTaskAssignments.isEmpty()) {
            log.info("Update called for period {} with no new assignments.", taskPeriod.getId());
            // Just save the period if other properties might have changed (though unlikely in this flow)
            return new TaskPeriodDto(taskPeriodRepository.save(taskPeriod));
        }

        Household household = taskPeriod.getHousehold();
        if (household == null) {
            // This shouldn't happen if taskPeriod is fetched correctly, but handle defensively
            log.error("Household is null for existing TaskPeriod ID: {}", taskPeriod.getId());
            throw new IllegalStateException("Household cannot be null for an existing TaskPeriod during update.");
        }
        Long householdId = household.getId();

        // Set relationships and household on new assignments
        newTaskAssignments.forEach(ta -> {
            ta.setTaskPeriod(taskPeriod);
            ta.setHousehold(household); // Ensure household is set correctly
            // Verify task and assignee belong to the same household if needed (optional extra check)
            if (ta.getTask() != null && !ta.getTask().getHousehold().getId().equals(householdId)) {
                log.error("Task {} in assignment does not belong to household {}", ta.getTask().getId(), householdId);
                throw new SecurityException("Task does not belong to the period's household.");
            }
            if (ta.getAssignee() != null && !ta.getAssignee().getHousehold().getId().equals(householdId)) {
                log.error("Assignee {} in assignment does not belong to household {}", ta.getAssignee().getId(), householdId);
                throw new SecurityException("Assignee does not belong to the period's household.");
            }
        });

        // Save the new assignments. JPA should handle adding them to the period's collection
        // if the relationship is correctly mapped and managed.
        taskAssignmentRepository.saveAll(newTaskAssignments);

        // Fetch the period again to ensure the DTO reflects the added assignments
        // Or rely on JPA's managed state if TaskPeriodDto constructor handles it.
        // For safety, fetching again is clearer.
        TaskPeriod updatedPeriod = taskPeriodRepository.findById(taskPeriod.getId())
                .orElseThrow(() -> new NoSuchElementException("Task period disappeared during update: " + taskPeriod.getId())); // Should not happen in transaction

        return new TaskPeriodDto(updatedPeriod);
    }

    @Override
    @Transactional
    public void delete(Long id, Long householdId, CTMUser user) {
        TaskPeriod period = taskPeriodRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No task period with id " + id));
        if (!period.getHousehold().getId().equals(user.getHousehold().getId())) {
            log.warn("User {} attempted to delete period {} belonging to another household.", user.getId(), id);
            throw new SecurityException("Access denied to delete task period " + id);
        }
        // Assuming CascadeType.REMOVE or orphanRemoval=true on TaskPeriod->TaskAssignments relationship
        // If not, delete assignments manually first:
        // taskAssignmentRepository.deleteAll(period.getTaskAssignments());
        taskPeriodRepository.deleteById(id);
        log.info("Deleted TaskPeriod with ID: {}", id);
    }

    @Override
    @Transactional
    public TaskPeriodDto create(TaskPeriod taskPeriod, CTMUser user) {
        // Ensure household is set correctly based on the creating user
        if (taskPeriod.getHousehold() == null) {
            taskPeriod.setHousehold(user.getHousehold());
        } else if (!taskPeriod.getHousehold().getId().equals(user.getHousehold().getId())) {
            log.warn("User {} attempted to create period for household {}.", user.getId(), taskPeriod.getHousehold().getId());
            throw new SecurityException("Cannot create period for another household.");
        }

        // Ensure assignments (if any are set *before* creation) also have the correct household
        if (taskPeriod.getTaskAssignments() != null) {
            Household household = taskPeriod.getHousehold();
            taskPeriod.getTaskAssignments().forEach(ta -> {
                ta.setHousehold(household);
                ta.setTaskPeriod(taskPeriod); // Ensure back-reference is set
            });
        }
        TaskPeriod savedPeriod = taskPeriodRepository.save(taskPeriod);
        log.info("Created new TaskPeriod with ID: {}", savedPeriod.getId());
        return new TaskPeriodDto(savedPeriod);
    }

    // --- End of Standard Methods ---


    // --- Period Creation Logic ---
    public TaskPeriodDto retrieveAndCreateTaskListPeriod(Long taskListId, PeriodCreationRqstV1 periodCreationRqstV1, CTMUser user) throws SystemException {
        TaskListOccasionDto taskListOccasionDto = occasionService.get(taskListId, user.getHousehold().getId(), user);
        periodCreationRqstV1.setTaskAssignmentRqst(taskListOccasionDto.getTaskAssignments().stream().map(taskAssignDto -> {
            BasicTaskAssignmentRqstV1 basicTaskAssignmentRqstV1 = new BasicTaskAssignmentRqstV1();
            basicTaskAssignmentRqstV1.setTaskId(taskAssignDto.getTask().getId());
            basicTaskAssignmentRqstV1.setAssigneeUserId(taskAssignDto.getHouseholdMemberDto().getId());
            return basicTaskAssignmentRqstV1;
        }).toList());

        return createPeriod(periodCreationRqstV1, user);
    }

    /**
     * Main entry point for creating or updating a task period with assignments.
     * Delegates to manual or automatic creation based on the request.
     */
    public TaskPeriodDto createPeriod(PeriodCreationRqstV1 rqst, CTMUser user) throws SystemException {
        if (rqst.getCreationMethod() == null) {
            log.error("CreationMethod is null in PeriodCreationRqstV1");
            throw new IllegalArgumentException("CreationMethod must be specified.");
        }
        if(rqst.getStartDate() == null) {
            log.error("Start Date is null");
            throw new IllegalArgumentException("Start date must be specified.");
        }

        // New validation: Duration is not required if explicitDueDate is provided
        if (rqst.getExplicitDueDate() == null && rqst.getDuration() == null) {
            log.error("Duration is null and no explicit date was specified");
            throw new IllegalArgumentException("Duration or explicitDueDate must be specified.");
        }

        log.info("Creating period via {} method for user {}", rqst.getCreationMethod(), user.getId());
        return switch (rqst.getCreationMethod()) {
            case AUTOMATIC -> createPeriodAutomatically(rqst, user);
            case MANUAL -> createPeriodManually(rqst, user);
        };
    }

    /**
     * Creates/Updates a TaskPeriod and manually specified TaskAssignments.
     */
    @Transactional
    public TaskPeriodDto createPeriodManually(PeriodCreationRqstV1 rqst, CTMUser user) {
        Date periodEndDate;
        if (rqst.getExplicitDueDate() != null) {
            periodEndDate = DateUtils.calculateEndDate(rqst.getStartDate(), rqst.getExplicitDueDate());
        } else {
            periodEndDate = DateUtils.calculateDueDate(rqst.getStartDate(), rqst.getDuration());
        }
        Household household = user.getHousehold();

        TaskPeriod taskPeriod;
        boolean isNewPeriod = rqst.getPeriodId() == null;
        if (isNewPeriod) {
            taskPeriod = generatePeriod(rqst, periodEndDate);
            taskPeriod.setHousehold(household);
            log.info("Generating new period for manual creation.");
        } else {
            taskPeriod = taskPeriodRepository.findByIdAndHouseholdId(rqst.getPeriodId(), household.getId())
                    .orElseThrow(() -> {
                        log.warn("Task period {} not found for household {} during manual update.", rqst.getPeriodId(), household.getId());
                        return new NoSuchElementException("No task period found with id " + rqst.getPeriodId() + " for your household.");
                    });
            log.info("Updating existing period {} for manual creation.", taskPeriod.getId());
        }

        if (rqst.getTaskAssignmentRqst() == null || rqst.getTaskAssignmentRqst().isEmpty()) {
            log.info("No task assignments requested for period {}. Saving period only.", isNewPeriod ? "(new)" : taskPeriod.getId());
            return isNewPeriod ? create(taskPeriod, user) : new TaskPeriodDto(taskPeriodRepository.save(taskPeriod));
        }

        Set<Long> requestedTaskIds = rqst.getTaskAssignmentRqst().stream()
                .map(BasicTaskAssignmentRqstV1::getTaskId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (requestedTaskIds.isEmpty()) {
            log.warn("Task assignment request list provided, but all task IDs were null.");
            return isNewPeriod ? create(taskPeriod, user) : new TaskPeriodDto(taskPeriodRepository.save(taskPeriod));
        }

        Map<Long, Task> taskMap = taskRepository.findAllByIdInAndHouseholdId(requestedTaskIds, household.getId())
                .stream()
                .collect(Collectors.toMap(Task::getId, Function.identity()));

        Map<Long, CTMUser> householdUsersMap = null;
        boolean assignToAllNeeded = rqst.getTaskAssignmentRqst().stream()
                .anyMatch(r -> r.getAssigneeUserId() != null && r.getAssigneeUserId() == 0L);

        if (assignToAllNeeded) {
            log.debug("Assignee ID 0 detected. Fetching all users for household {}.", household.getId());
            householdUsersMap = householdRepository.findById(household.getId())
                    .map(Household::getUsers)
                    .orElse(Collections.emptyList())
                    .stream()
                    .collect(Collectors.toMap(CTMUser::getId, Function.identity()));
            if (householdUsersMap.isEmpty()) {
                log.warn("Assignee ID 0 requested, but no users found for household {}.", household.getId());
            }
        } else {
            Set<Long> specificUserIds = rqst.getTaskAssignmentRqst().stream()
                    .map(BasicTaskAssignmentRqstV1::getAssigneeUserId)
                    .filter(id -> id != null && id != 0L)
                    .collect(Collectors.toSet());
            if (!specificUserIds.isEmpty()) {
                log.debug("Fetching specific users {} for household {}.", specificUserIds, household.getId());
                householdUsersMap = userRepository.findAllByIdInAndHouseholdId(specificUserIds, household.getId())
                        .stream()
                        .collect(Collectors.toMap(CTMUser::getId, Function.identity()));
            } else {
                log.debug("No specific user IDs (excluding 0) requested.");
                householdUsersMap = Collections.emptyMap();
            }
        }

        List<TaskAssignment> newTaskAssignments = new ArrayList<>();
        Date creationDate = new Date();

        for (BasicTaskAssignmentRqstV1 basicRqst : rqst.getTaskAssignmentRqst()) {
            if (basicRqst.getTaskId() == null) {
                log.warn("Skipping assignment request with null Task ID.");
                continue;
            }

            Task task = taskMap.get(basicRqst.getTaskId());
            if (task == null) {
                log.warn("Task with ID {} not found or not accessible in household {}. Skipping assignment.", basicRqst.getTaskId(), household.getId());
                continue;
            }

            List<CTMUser> targetAssignees = new ArrayList<>();
            Long requestedAssigneeId = basicRqst.getAssigneeUserId();

            if (requestedAssigneeId != null && requestedAssigneeId == 0L) {
                if (householdUsersMap != null && !householdUsersMap.isEmpty()) {
                    targetAssignees.addAll(householdUsersMap.values());
                    log.debug("Assigning task {} to all {} users.", task.getId(), householdUsersMap.size());
                } else {
                    log.warn("Assignee ID 0 requested for task {}, but household user map is null or empty. No assignments created for this request.", task.getId());
                    continue;
                }
            } else if (requestedAssigneeId != null) {
                CTMUser specificAssignee = householdUsersMap != null ? householdUsersMap.get(requestedAssigneeId) : null;
                if (specificAssignee == null) {
                    log.debug("Assignee {} not in pre-fetched map, attempting direct fetch.", requestedAssigneeId);
                    specificAssignee = userRepository.findByIdAndHouseholdId(requestedAssigneeId, household.getId()).orElse(null);
                }

                if (specificAssignee != null) {
                    targetAssignees.add(specificAssignee);
                    log.debug("Assigning task {} to specific user {}.", task.getId(), specificAssignee.getId());
                } else {
                    log.warn("Assignee with ID {} not found in household {}. Skipping assignment for task {}.", requestedAssigneeId, household.getId(), task.getId());
                    continue;
                }
            } else {
                log.warn("Assignee User ID is null for task {}. Skipping assignment.", task.getId());
                continue;
            }

            List<Date> dueDates;
            boolean createOnce = Boolean.TRUE.equals(rqst.getCreateEachTaskOnce());
            if (createOnce) {
                dueDates = occurenceButAtLeastOne(rqst.getStartDate(), periodEndDate, rqst.getExplicitDueDate(), task.getFrequency());
                log.debug("Calculated 'at least one' due date(s) for task {}: {}", task.getId(), dueDates);
            } else {
                dueDates = occurenceInPeriod(rqst.getStartDate(), periodEndDate, rqst.getExplicitDueDate(), task.getFrequency());
                log.debug("Calculated 'occurrence in period' due date(s) for task {}: {}", task.getId(), dueDates);
            }

            if (dueDates.isEmpty()) {
                log.warn("No due dates calculated for task {} with frequency {} within the period/rules. No assignments created.", task.getId(), task.getFrequency());
                continue;
            }

            for (CTMUser assignee : targetAssignees) {
                for (Date dueDate : dueDates) {
                    newTaskAssignments.add(
                            map(task, taskPeriod, assignee, dueDate, rqst.getStartDate(), rqst.getExplicitDueDate(), creationDate, household)
                    );
                }
            }
        }

        log.info("Generated {} new task assignments for period {}.", newTaskAssignments.size(), isNewPeriod ? "(new)" : taskPeriod.getId());

        if (isNewPeriod) {
            taskPeriod.setTaskAssignments(newTaskAssignments);
            return create(taskPeriod, user);
        } else {
            return update(taskPeriod, newTaskAssignments);
        }
    }

    /**
     * Creates/Updates a TaskPeriod and automatically generates TaskAssignments for all users
     * based on their TaskLists.
     */
    @Transactional
    public TaskPeriodDto createPeriodAutomatically(PeriodCreationRqstV1 rqst, CTMUser user) throws SystemException {
        Date periodEndDate;
        if(rqst.getExplicitDueDate() != null){
            periodEndDate = DateUtils.calculateEndDate(rqst.getStartDate(), rqst.getExplicitDueDate());
        } else {
            periodEndDate = DateUtils.calculateDueDate(rqst.getStartDate(), rqst.getDuration());
        }

        // Fetch household with users eagerly using the dedicated repository method
        Household household = householdRepository.findById(user.getHousehold().getId())
                .orElseThrow(() -> {
                    log.error("Household {} not found for user {} during automatic creation.", user.getHousehold().getId(), user.getId());
                    return new SystemException("Household not found for user");
                });

        // 1. Get or Create TaskPeriod
        TaskPeriod taskPeriod;
        boolean isNewPeriod = rqst.getPeriodId() == null;
        if (isNewPeriod) {
            taskPeriod = generatePeriod(rqst, periodEndDate);
            taskPeriod.setHousehold(household); // Set household for the new period
            log.info("Generating new period for automatic creation.");
        } else {
            taskPeriod = taskPeriodRepository.findByIdAndHouseholdId(rqst.getPeriodId(), household.getId())
                    .orElseThrow(() -> {
                        log.warn("Task period {} not found for household {} during automatic update.", rqst.getPeriodId(), household.getId());
                        return new NoSuchElementException("No task period found with id " + rqst.getPeriodId() + " for your household.");
                    });
            log.info("Updating existing period {} for automatic creation.", taskPeriod.getId());
            // Optionally update period dates if needed
            // taskPeriod.setStartDate(rqst.getStartDate());
            // taskPeriod.setEndDate(periodEndDate);
        }

        // 2. Generate TaskAssignments for all users in the household
        List<CTMUser> usersInHousehold = household.getUsers();
        if (usersInHousehold == null || usersInHousehold.isEmpty()) {
            log.warn("No users found in household {} during automatic creation. No assignments will be generated.", household.getId());
            // Proceed to save the period without assignments
            return isNewPeriod ? create(taskPeriod, user) : new TaskPeriodDto(taskPeriodRepository.save(taskPeriod));
        }

        log.info("Generating automatic assignments for {} users in household {}.", usersInHousehold.size(), household.getId());
        List<TaskAssignment> newTaskAssignments = usersInHousehold.stream()
                .flatMap(assignee -> generateTaskAssignmentsForUser(assignee, rqst, taskPeriod, periodEndDate, household).stream())
                .collect(Collectors.toList()); // Use Collectors.toList() for mutable list if needed later, or .toList() for immutable

        log.info("Generated {} new task assignments automatically for period {}.", newTaskAssignments.size(), isNewPeriod ? "(new)" : taskPeriod.getId());

        // 3. Save/Update
        if (isNewPeriod) {
            taskPeriod.setTaskAssignments(newTaskAssignments);
            return create(taskPeriod, user);
        } else {
            // Add new assignments to the existing period
            return update(taskPeriod, newTaskAssignments);
        }
    }

    // --- Helper Methods ---

    /**
     * Helper to generate assignments for a single user in automatic mode.
     */
    private List<TaskAssignment> generateTaskAssignmentsForUser(CTMUser assignee, PeriodCreationRqstV1 rqst, TaskPeriod taskPeriod, Date periodEndDate, Household household) {
        // Fetch TaskList for the assignee (repository method handles eager fetching of tasks)
        TaskList taskList = taskListRepository.findByAssigneeIdAndHouseholdId(assignee.getId(), household.getId()).orElse(null);

        if (taskList == null || taskList.getTasks() == null || taskList.getTasks().isEmpty()) {
            log.debug("No task list or tasks found for user {} in household {}. Skipping assignment generation.", assignee.getId(), household.getId());
            return Collections.emptyList(); // Return empty list if no task list or no tasks in it
        }

        log.debug("Generating assignments for user {} based on {} tasks in their list.", assignee.getId(), taskList.getTasks().size());
        Date startDate = rqst.getStartDate();
        Date creationDate = new Date(); // Single creation date for this batch

        return taskList.getTasks().stream()
                .filter(Objects::nonNull) // Ensure task is not null
                .flatMap(task -> {
                    // Determine due dates based on the flag
                    List<Date> dueDates;
                    boolean createOnce = Boolean.TRUE.equals(rqst.getCreateEachTaskOnce());
                    dueDates = createOnce
                            ? Collections.singletonList(periodEndDate)
                            : occurenceInPeriod(startDate, periodEndDate, rqst.getExplicitDueDate(), task.getFrequency());

                    if (dueDates.isEmpty()) {
                        log.debug("No due dates calculated for task {} (User {})", task.getId(), assignee.getId());
                        return Stream.empty(); // Return an empty stream if no dates
                    }

                    // Create assignment for each due date
                    return dueDates.stream()
                            .map(dueDate -> map(task, taskPeriod, assignee, dueDate, startDate, rqst.getExplicitDueDate(), creationDate, household));
                })
                .collect(Collectors.toList()); // Collect results for this user
    }


    /**
     * Maps entity data to a TaskAssignment object.
     */
    private TaskAssignment map(Task task, TaskPeriod taskPeriod, CTMUser assignee, Date dueDate, Date startDate, Date explicitDueDate, Date creationDate, Household household) {
        TaskAssignment taskAssignment = new TaskAssignment();
        taskAssignment.setTask(task);
        taskAssignment.setAssignee(assignee);
        taskAssignment.setCompleted(false);
        taskAssignment.setStartDate(startDate); // Period start date
        taskAssignment.setCreationDate(creationDate == null ? new Date() : creationDate);
        taskAssignment.setDueDate(dueDate); // The calculated due date
        taskAssignment.setTaskPeriod(taskPeriod);
        taskAssignment.setHousehold(household); // Set the household
        return taskAssignment;
    }

    /**
     * Generates a new TaskPeriod object (without saving).
     */
    private TaskPeriod generatePeriod(PeriodCreationRqstV1 rqst, Date calculatedEndDate) {
        TaskPeriod taskPeriod = new TaskPeriod();
        // ID is generated by JPA on save, do not set here.
        taskPeriod.setStartDate(rqst.getStartDate());
        taskPeriod.setEndDate(calculatedEndDate); // Use the calculated end date
        taskPeriod.setCompleted(false);
        // Household is set in the calling methods (createPeriodManually/Automatically)
        return taskPeriod;
    }

    /**
     * Calculates all occurrences of a frequency between a start and end date.
     * Considers an optional explicit date to potentially shorten the calculation window.
     */
    private List<Date> occurenceInPeriod(Date startDate, Date periodEndDate, Date explicitDate, Frequency frequency) {
        List<Date> dates = new ArrayList<>();

        // Determine the effective end date for calculation. Use explicitDate if it's earlier than periodEndDate.
        Date calculationEndDate = periodEndDate;
        if (explicitDate != null && explicitDate.before(periodEndDate)) {
            calculationEndDate = explicitDate;
            log.trace("Using explicit date {} as calculation end date.", calculationEndDate);
        } else {
            log.trace("Using period end date {} as calculation end date.", calculationEndDate);
        }


        if (frequency == null) {
            // Handle NONE frequency: Only add explicitDate if it's provided and within the period range.
            if (explicitDate != null && !explicitDate.after(periodEndDate) && !explicitDate.before(startDate)) {
                log.trace("Frequency is NONE, adding explicit date: {}", explicitDate);
                dates.add(explicitDate);
            } else {
                log.trace("Frequency is NONE and no valid explicit date provided within period. No dates added.");
            }
            return dates;
        }

        int daysToAdd = frequency.getDaysAmount();
        if (daysToAdd <= 0) {
            log.warn("Frequency {} has non-positive days amount ({}). Returning empty date list.", frequency, daysToAdd);
            return dates; // Avoid infinite loops or unexpected behavior
        }

        // Start calculating from the period's start date
        Date currentDate = new Date(startDate.getTime());

        while (true) {
            // Calculate the next potential due date based on the *current* date and frequency
            Date nextDueDate = DateUtils.calculateDueDate(currentDate, frequency);

            // Check if the calculated date is beyond the calculation end date
            if (nextDueDate.after(calculationEndDate)) {
                log.trace("Calculated date {} is after calculation end date {}. Stopping.", nextDueDate, calculationEndDate);
                break;
            }

            // Only add the date if it's on or after the period start date
            // (Handles cases where first calculation might land before startDate)
            if (!nextDueDate.before(startDate)) {
                log.trace("Adding calculated due date: {}", nextDueDate);
                dates.add(nextDueDate);
            } else {
                log.trace("Calculated date {} is before start date {}. Skipping.", nextDueDate, startDate);
            }

            // Move current date forward for the next iteration.
            // Crucially, advance based on the *calculated* date to handle frequencies correctly.
            currentDate = nextDueDate;

            // Safety break for potential infinite loops (e.g., if DateUtils doesn't advance date)
            // This depends on DateUtils implementation, but a basic check can help.
            // Consider adding a max iteration count if DateUtils logic is complex.
        }
        return dates;
    }

    /**
     * Calculates occurrences like occurenceInPeriod, but guarantees at least one date is returned.
     * If occurrences are found, returns the first one. If not, calculates the first theoretical
     * occurrence after the start date or uses explicit/end dates as fallbacks.
     */
    private List<Date> occurenceButAtLeastOne(Date startDate, Date periodEndDate, Date explicitEndDate, Frequency frequency) {
        log.trace("Calculating 'at least one' occurrence (now all occurrences or period end) for start={}, end={}, explicit={}, freq={}", startDate, periodEndDate, explicitEndDate, frequency);
        List<Date> datesInPeriod = occurenceInPeriod(startDate, periodEndDate, explicitEndDate, frequency);

        if (!datesInPeriod.isEmpty()) {
            // If occurrences were found within the period (respecting explicitEndDate), return *all* of them.
            log.trace("Found occurrences in period. Returning all occurrences: {}", datesInPeriod);
            return Collections.singletonList(datesInPeriod.get(datesInPeriod.size() - 1)); // *** CHANGED: Return all dates ***
        } else {
            // No occurrences found within the period/rules.
            log.trace("No occurrences found in period. Returning period end date as the only due date: {}", periodEndDate);
            return Collections.singletonList(periodEndDate); // *** CHANGED: Return only period end date ***
        }
    }
}