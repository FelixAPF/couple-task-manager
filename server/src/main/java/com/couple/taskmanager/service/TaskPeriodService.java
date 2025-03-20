package com.couple.taskmanager.service;

import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskAssignment;
import com.couple.taskmanager.model.TaskAssignmentDto;
import com.couple.taskmanager.model.TaskPeriod;
import com.couple.taskmanager.repository.ITaskPeriodRepository;
import com.couple.taskmanager.repository.TaskAssignmentRepository;
import com.couple.taskmanager.repository.TaskPeriodRepositoryImpl;
import com.couple.taskmanager.repository.TaskRepository;
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class TaskPeriodService implements IGenericService<TaskPeriod> {
    @Autowired
    ITaskPeriodRepository ITaskPeriodRepository;
    @Autowired
    TaskRepository taskRepository;
    @Autowired
    TaskAssignmentRepository taskAssignmentRepository;

    @Override
    public TaskPeriod get(Long id) {
        return ITaskPeriodRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No task period with id " + id));
    }

    @Override
    public List<TaskPeriod> list() {
        return ITaskPeriodRepository.findAll();
    }

    @Override
    public TaskPeriod update(Long id, TaskPeriod taskPeriod) {
        return ITaskPeriodRepository.save(taskPeriod);
    }

    @Override
    public void delete(Long id) {
        ITaskPeriodRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void create(TaskPeriod taskPeriod) {
        StreamUtils.ofNullable(taskPeriod.getTaskAssignments())
                .filter(taskAssignment -> taskAssignment.getId() == null)
                .forEach(taskAssignment -> {
                    if(taskAssignment.getTask().getId() == null){
                        taskRepository.save(taskAssignment.getTask());
                    }
                    taskAssignmentRepository.save(taskAssignment);
                });
        ITaskPeriodRepository.save(taskPeriod);
    }

}
