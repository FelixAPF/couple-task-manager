package com.couple.taskmanager.service;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.model.*;
import com.couple.taskmanager.model.dto.PeriodCreationRqstV1;
import com.couple.taskmanager.repository.*;
import com.couple.taskmanager.utils.DateUtils;
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

import static com.couple.taskmanager.utils.StreamUtils.ofNullable;

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
    public void create(TaskPeriod taskPeriod) {
        taskPeriodRepository.save(taskPeriod);
    }

    public void createPeriodAutomatically(PeriodCreationRqstV1 rqst){
        Date dueDate = DateUtils.calculateDueDate(rqst.getStartDate(), rqst.getDuration());

        List<TaskAssignment> taskAssignments = new ArrayList<>();

        TaskPeriod taskPeriod = generatePeriod(rqst, dueDate);
        taskAssignments.addAll(generateTaskAssignments(Assignee.Felix,rqst, taskPeriod));
        taskAssignments.addAll(generateTaskAssignments(Assignee.Camille, rqst, taskPeriod));

        if(taskPeriod.getId() == null){
            taskPeriod.setTaskAssignments(taskAssignments);
            create(taskPeriod);
        } else {
            update(taskPeriod, taskAssignments);
        }
    }

    private List<TaskAssignment> generateTaskAssignments(Assignee assignee, PeriodCreationRqstV1 rqst, TaskPeriod taskPeriod) {
        TaskList taskList = taskListRepository.findByAssignee(assignee);
        if (taskList == null) return new ArrayList<>();
        Date startDate = rqst.getStartDate();
        Date periodEndDate = DateUtils.calculateDueDate(startDate, rqst.getDuration());

        return taskList.getTasks().stream()
                .flatMap(task -> occurenceInPeriod(startDate, periodEndDate, task.getFrequency()).stream()
                        .map(dueDate -> {
                            TaskAssignment taskAssignment = new TaskAssignment();
                            taskAssignment.setTask(task);
                            taskAssignment.setAssignee(assignee);
                            taskAssignment.setCompleted(false);
                            taskAssignment.setCreationDate(startDate);
                            taskAssignment.setDueDate(dueDate);
                            taskAssignment.setTaskPeriod(taskPeriod);
                            return taskAssignment;
                        }))
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
