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

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.NoSuchElementException;
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


    public TaskPeriod update(TaskPeriod taskPeriod, List<TaskAssignment> taskAssignments) {
        // Load the existing TaskPeriod
        TaskPeriod existingPeriod = get(taskPeriod.getId());
        //delete the old task assignments
        List<TaskAssignment> oldAssignments = taskAssignmentRepository.findAllByTaskPeriodId(taskPeriod.getId());
        oldAssignments.forEach(ta -> taskAssignmentRepository.delete(ta));
        // Set the new values
        existingPeriod.setStartDate(taskPeriod.getStartDate());
        // Save all new taskAssignments
        taskAssignments.forEach(ta -> {
            ta.setTaskPeriod(existingPeriod);
            taskAssignmentRepository.save(ta);
        });
        existingPeriod.getTaskAssignments().addAll(taskAssignments);
        return taskPeriodRepository.save(existingPeriod);
    }

    @Override
    public void delete(Long id) {
        taskPeriodRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void create(TaskPeriod taskPeriod) {
        ofNullable(taskPeriod.getTaskAssignments())
                .filter(taskAssignment -> taskAssignment.getId() == null)
                .forEach(taskAssignment -> {
                    if(taskAssignment.getTask().getId() == null){
                        taskRepository.save(taskAssignment.getTask());
                    }
                    taskAssignmentRepository.save(taskAssignment);
                });
        taskPeriodRepository.save(taskPeriod);
    }

    public void createPeriodAutomatically(PeriodCreationRqstV1 rqst){
        Date dueDate = DateUtils.calculateDueDate(rqst.getStartDate(), rqst.getDuration());

        List<TaskAssignment> taskAssignments = new ArrayList<>();

        taskAssignments.addAll(generateTaskAssignments(Assignee.Felix,rqst));
        taskAssignments.addAll(generateTaskAssignments(Assignee.Camille, rqst));
        TaskPeriod taskPeriod = generatePeriod(rqst, taskAssignments, dueDate);

        if(rqst.getPeriodId() != null){
            update(taskPeriod, taskAssignments);
        } else {
            create(taskPeriod);
        }
    }

    private List<TaskAssignment> generateTaskAssignments(Assignee assignee, PeriodCreationRqstV1 rqst){
        TaskList taskList = taskListRepository.findByAssignee(assignee);
        if(taskList == null) return new ArrayList<>();
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
                            return taskAssignment;
                        }))
                .toList();
    }

    private TaskPeriod generatePeriod(PeriodCreationRqstV1 rqst, List<TaskAssignment> taskAssignments, Date dueDate){
        TaskPeriod taskPeriod = new TaskPeriod();
        taskPeriod.setId(rqst.getPeriodId());
        taskPeriod.setTaskAssignments(taskAssignments);
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
