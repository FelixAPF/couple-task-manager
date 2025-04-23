package com.couple.taskmanager.service;

import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.model.*;
import com.couple.taskmanager.model.dto.BasicTaskAssignmentRqstV1;
import com.couple.taskmanager.model.dto.PeriodCreationRqstV1;
import com.couple.taskmanager.model.dto.TaskPeriodDto;
import com.couple.taskmanager.repository.*;
import com.couple.taskmanager.utils.DateUtils;
import com.couple.taskmanager.utils.StreamUtils;
import jakarta.transaction.SystemException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TaskPeriodService implements IGenericService<TaskPeriod, TaskPeriodDto> {
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

    @Override
    public TaskPeriodDto get(Long id, Long householdId, CTMUser user) {
        return taskPeriodRepository.findById(id)
                .map(TaskPeriodDto::new)
                .orElseThrow(() -> new NoSuchElementException("No task period with id " + id));
    }

    @Override
    public List<TaskPeriodDto> list(Long householdId, CTMUser user) {
        return StreamUtils.mapToList(taskPeriodRepository.findAllByHouseholdId(user.getHousehold().getId()), TaskPeriodDto::new);
    }

    public List<TaskPeriodDto> listIncomplete(CTMUser user) {
        return StreamUtils.mapToList(taskPeriodRepository.findByCompletedFalse(user.getHousehold().getId()), TaskPeriodDto::new);
    }

    @Override
    public TaskPeriodDto update(Long id, TaskPeriod taskPeriod, CTMUser user) {
        throw new IllegalArgumentException();
    }

    @Transactional
    public TaskPeriodDto update(TaskPeriod taskPeriod, List<TaskAssignment> taskAssignments) {
        List<TaskAssignment> list = taskAssignments.stream()
                .peek(taskAssignment -> taskAssignment.setTaskPeriod(taskPeriod)).toList();
        taskAssignmentRepository.saveAll(list);
        return new TaskPeriodDto(taskPeriodRepository.save(taskPeriod));
    }

    @Override
    public void delete(Long id, Long householdId, CTMUser user) {
        taskPeriodRepository.deleteById(id);
    }

    @Override
    @Transactional
    public TaskPeriodDto create(TaskPeriod taskPeriod, CTMUser user) {
        if(taskPeriod.getHousehold() == null){
            taskPeriod.setHousehold(user.getHousehold());
        }
        return new TaskPeriodDto(taskPeriodRepository.save(taskPeriod));
    }

    public TaskPeriodDto createPeriod(PeriodCreationRqstV1 rqst, CTMUser user) throws SystemException {
        return switch (rqst.getCreationMethod()){
            case AUTOMATIC -> createPeriodAutomatically(rqst, user);
            case MANUAL -> createPeriodManually(rqst, user);
        };
    }

    public TaskPeriodDto createPeriodManually(PeriodCreationRqstV1 rqst, CTMUser user){
        Date periodEndDate = DateUtils.calculateDueDate(rqst.getStartDate(), rqst.getDuration());
        List<Task> tasks = taskRepository.findAll();

        TaskPeriod taskPeriod = rqst.getPeriodId() == null ? generatePeriod(rqst, periodEndDate) : taskPeriodRepository.findById(rqst.getPeriodId()).orElseThrow(NoSuchElementException::new);

        Map<Long, Task> taskMap = StreamUtils.ofNullable(tasks).filter(t -> StreamUtils.ofNullable(rqst.getTaskAssignmentRqst())
                        .map(BasicTaskAssignmentRqstV1::getTaskId)
                        .anyMatch(taskId -> Objects.equals(t.getId(), taskId)))
                .collect(Collectors.toMap(Task::getId, task -> task));
        if(taskMap.isEmpty()) return create(taskPeriod, user);

        List<TaskAssignment> taskAssignments = new ArrayList<>();

        if(rqst.getCreateEachTaskOnce()){
            taskAssignments.addAll(StreamUtils.ofNullable(rqst.getTaskAssignmentRqst()).map((r) ->
                    map(taskMap.get(r.getTaskId()), taskPeriod, r.getAssigneeUserId(), periodEndDate, taskPeriod.getStartDate(), rqst.getExplicitDueDate(), new Date()))
                    .toList());
        } else {
            taskAssignments.addAll(StreamUtils.ofNullable(rqst.getTaskAssignmentRqst())
                    .flatMap(task -> occurenceButAtLeastOne(rqst.getStartDate(), periodEndDate, rqst.getExplicitDueDate(), taskMap.get(task.getTaskId()).getFrequency()).stream()
                            .map(dueDate -> map(taskMap.get(task.getTaskId()), taskPeriod,  task.getAssigneeUserId(), dueDate, taskPeriod.getStartDate(), rqst.getExplicitDueDate(), new Date())))
                    .toList());
        }

        if(taskPeriod.getId() == null){
            taskPeriod.setTaskAssignments(taskAssignments);
            return create(taskPeriod, user);
        } else {
            return update(taskPeriod, taskAssignments);
        }
    }

    private TaskAssignment map(Task task, TaskPeriod taskPeriod, Long assigneeUserId, Date dueDate, Date startDate, Date explicitDueDate, Date creationDate){
        TaskAssignment taskAssignment = new TaskAssignment();
        taskAssignment.setTask(task);

        taskAssignment.setAssignee(userRepository.findById(assigneeUserId).orElseThrow(NoSuchElementException::new));
        taskAssignment.setCompleted(false);
        taskAssignment.setStartDate(startDate);
        taskAssignment.setCreationDate(creationDate == null ? new Date() : creationDate);
        taskAssignment.setDueDate(explicitDueDate == null ? dueDate : explicitDueDate);
        taskAssignment.setTaskPeriod(taskPeriod);
        return taskAssignment;
    }

    public TaskPeriodDto createPeriodAutomatically(PeriodCreationRqstV1 rqst, CTMUser user) throws SystemException {
        Date periodEndDate = DateUtils.calculateDueDate(rqst.getStartDate(), rqst.getDuration());
        Household household = householdRepository.findById(user.getHousehold().getId()).orElseThrow(SystemException::new);

        TaskPeriod taskPeriod = generatePeriod(rqst, periodEndDate);
        List<TaskAssignment> taskAssignments = StreamUtils.ofNullable(household.getUsers())
                .flatMap(assignee -> generateTaskAssignments(assignee, rqst, taskPeriod, periodEndDate, user).stream())
                .toList();

        if(taskPeriod.getId() == null){
            taskPeriod.setTaskAssignments(taskAssignments);
            return create(taskPeriod, user);
        } else {
            return update(taskPeriod, taskAssignments);
        }
    }

    private List<TaskAssignment> generateTaskAssignments(CTMUser assignee, PeriodCreationRqstV1 rqst, TaskPeriod taskPeriod, Date periodEndDate, CTMUser user) {
        TaskList taskList = taskListRepository.findByAssignee(assignee.getId(), user.getHousehold().getId()).orElse(null);
        if (taskList == null) return new ArrayList<>();
        Date startDate = rqst.getStartDate();

        return taskList.getTasks().stream()
                .flatMap(task -> occurenceInPeriod(startDate, periodEndDate, rqst.getExplicitDueDate(), task.getFrequency()).stream()
                        .map(dueDate -> map(task, taskPeriod, assignee.getId(), dueDate, startDate, rqst.getExplicitDueDate(), new Date())))
                .toList();
    }

    private TaskPeriod generatePeriod(PeriodCreationRqstV1 rqst, Date dueDate){
        TaskPeriod taskPeriod = new TaskPeriod();
        taskPeriod.setId(rqst.getPeriodId());
        taskPeriod.setStartDate(rqst.getStartDate());
        taskPeriod.setEndDate(dueDate);
        taskPeriod.setCompleted(false);
        return taskPeriod;
    }

    private List<Date> occurenceInPeriod(Date startDate, Date periodEndDate, Date explicitDate, Frequency frequency){
        List<Date> dates = new ArrayList<>();
        Date endDate = explicitDate == null ? periodEndDate : explicitDate;
        Date currentDate = startDate;
        while (currentDate.before(endDate)) {
            currentDate = DateUtils.calculateDueDate(currentDate, frequency);
            if(currentDate.after(periodEndDate)) break;
            dates.add(currentDate);
        }
        return dates;
    }

    private List<Date> occurenceButAtLeastOne(Date startDate, Date periodEndDate, Date explicitEndDate, Frequency frequency){
        List<Date> dates = occurenceInPeriod(startDate, periodEndDate, explicitEndDate, frequency);
        if(!dates.isEmpty()) return dates;
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.DAY_OF_YEAR, frequency.getDaysAmount());
        dates.add(calendar.getTime());
        return dates;
    }



}
