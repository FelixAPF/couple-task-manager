package com.couple.taskmanager.service;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.model.*;
import com.couple.taskmanager.model.dto.BasicTaskAssignmentRqstV1;
import com.couple.taskmanager.model.dto.PeriodCreationRqstV1;
import com.couple.taskmanager.repository.*;
import com.couple.taskmanager.utils.DateUtils;
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TaskPeriodService implements IGenericService<TaskPeriod> {
    @Autowired
    ITaskPeriodRepository taskPeriodRepository;
    @Autowired
    TaskRepository taskRepository;
    @Autowired
    TaskAssignmentRepository taskAssignmentRepository;
    @Autowired
    TaskListRepository taskListRepository;

    @Override
    public TaskPeriod get(Long id) {
        return taskPeriodRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No task period with id " + id));
    }

    @Override
    public List<TaskPeriod> list() {
        return taskPeriodRepository.findAll();
    }

    public List<TaskPeriod> listIncomplete() {
        return taskPeriodRepository.findByCompletedFalse();
    }

    @Override
    public TaskPeriod update(Long id, TaskPeriod taskPeriod) {
        throw new IllegalArgumentException();
    }

    @Transactional
    public TaskPeriod update(TaskPeriod taskPeriod, List<TaskAssignment> taskAssignments) {
        List<TaskAssignment> list = taskAssignments.stream()
                .peek(taskAssignment -> taskAssignment.setTaskPeriod(taskPeriod)).toList();
        taskAssignmentRepository.saveAll(list);
        return taskPeriodRepository.save(taskPeriod);
    }

    @Override
    public void delete(Long id) {
        taskPeriodRepository.deleteById(id);
    }

    @Override
    @Transactional
    public TaskPeriod create(TaskPeriod taskPeriod) {
        return taskPeriodRepository.save(taskPeriod);
    }

    public TaskPeriod createPeriod(PeriodCreationRqstV1 rqst){
        return switch (rqst.getCreationMethod()){
            case AUTOMATIC -> createPeriodAutomatically(rqst);
            case MANUAL -> createPeriodManually(rqst);
        };
    }

    public TaskPeriod createPeriodManually(PeriodCreationRqstV1 rqst){
        Date periodEndDate = DateUtils.calculateDueDate(rqst.getStartDate(), rqst.getDuration());
        Date startDate = rqst.getStartDate();
        List<Task> tasks = taskRepository.findAll();

        TaskPeriod taskPeriod = generatePeriod(rqst, periodEndDate);

        Map<Long, Task> taskMap = StreamUtils.ofNullable(tasks).filter(t -> StreamUtils.ofNullable(rqst.getTaskAssignmentRqst())
                        .map(BasicTaskAssignmentRqstV1::getTaskId)
                        .anyMatch(taskId -> Objects.equals(t.getId(), taskId)))
                .collect(Collectors.toMap(Task::getId, task -> task));
        if(taskMap.isEmpty()) return create(taskPeriod);

        List<TaskAssignment> taskAssignments = new ArrayList<>();

        if(rqst.getCreateEachTaskOnce()){
            taskAssignments.addAll(StreamUtils.ofNullable(rqst.getTaskAssignmentRqst()).map((r) ->
                    map(taskMap.get(r.getTaskId()), taskPeriod, r.getAssignee(), periodEndDate, startDate, rqst.getExplicitDueDate()))
                    .toList());
        } else {
            taskAssignments.addAll(StreamUtils.ofNullable(rqst.getTaskAssignmentRqst())
                    .flatMap(task -> occurenceInPeriod(startDate, periodEndDate, taskMap.get(task.getTaskId()).getFrequency()).stream()
                            .map(dueDate -> map(taskMap.get(task.getTaskId()), taskPeriod,  task.getAssignee(), dueDate, startDate, rqst.getExplicitDueDate())))
                    .toList());
        }

        if(taskPeriod.getId() == null){
            taskPeriod.setTaskAssignments(taskAssignments);
            return create(taskPeriod);
        } else {
            return update(taskPeriod, taskAssignments);
        }
    }

    private TaskAssignment map(Task task, TaskPeriod taskPeriod, Assignee assignee, Date dueDate, Date startDate, Date explicitDueDate){
        TaskAssignment taskAssignment = new TaskAssignment();
        taskAssignment.setTask(task);
        taskAssignment.setAssignee(assignee);
        taskAssignment.setCompleted(false);
        taskAssignment.setCreationDate(startDate);
        taskAssignment.setDueDate(explicitDueDate == null ? dueDate : explicitDueDate);
        taskAssignment.setTaskPeriod(taskPeriod);
        return taskAssignment;
    }

    public TaskPeriod createPeriodAutomatically(PeriodCreationRqstV1 rqst){
        Date periodEndDate = DateUtils.calculateDueDate(rqst.getStartDate(), rqst.getDuration());

        List<TaskAssignment> taskAssignments = new ArrayList<>();

        TaskPeriod taskPeriod = generatePeriod(rqst, periodEndDate);
        taskAssignments.addAll(generateTaskAssignments(Assignee.Felix,rqst, taskPeriod, periodEndDate));
        taskAssignments.addAll(generateTaskAssignments(Assignee.Camille, rqst, taskPeriod, periodEndDate));

        if(taskPeriod.getId() == null){
            taskPeriod.setTaskAssignments(taskAssignments);
            return create(taskPeriod);
        } else {
            return update(taskPeriod, taskAssignments);
        }
    }

    private List<TaskAssignment> generateTaskAssignments(Assignee assignee, PeriodCreationRqstV1 rqst, TaskPeriod taskPeriod, Date periodEndDate) {
        TaskList taskList = taskListRepository.findByAssignee(assignee);
        if (taskList == null) return new ArrayList<>();
        Date startDate = rqst.getStartDate();

        return taskList.getTasks().stream()
                .flatMap(task -> occurenceInPeriod(startDate, periodEndDate, task.getFrequency()).stream()
                        .map(dueDate -> map(task, taskPeriod, assignee, dueDate, startDate, rqst.getExplicitDueDate())))
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

    private List<Date> occurenceInPeriod(Date startDate, Date periodEndDate, Frequency frequency){
        List<Date> dates = new ArrayList<>();
        Date currentDate = startDate;
        while (currentDate.before(periodEndDate)) {
            currentDate = DateUtils.calculateDueDate(currentDate, frequency);
            if(currentDate.after(periodEndDate)) break;
            dates.add(currentDate);
        }
        return dates;
    }



}
