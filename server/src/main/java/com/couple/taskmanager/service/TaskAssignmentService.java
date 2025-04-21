package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.TaskAssignment;
import com.couple.taskmanager.model.dto.TaskAssignmentDto;
import com.couple.taskmanager.repository.TaskAssignmentRepository;
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class TaskAssignmentService implements IGenericService<TaskAssignment> {
    @Autowired
    TaskAssignmentRepository taskAssignmentRepository;


    @Override
    public TaskAssignment get(Long id, CTMUser user) {
        return taskAssignmentRepository.findById(id).orElseThrow(NoSuchElementException::new);
    }

    @Override
    public List<TaskAssignment> list(CTMUser user) {
        return taskAssignmentRepository.findAll();
    }

    public List<TaskAssignmentDto> list(Long taskId){
        return StreamUtils.ofNullable(taskAssignmentRepository.findAllByTaskIdAndCompletedTrue(taskId))
                .map(TaskAssignmentDto::new)
                .toList();
    }

    @Override
    public TaskAssignment update(Long id, TaskAssignment taskAssignment, CTMUser user) {
        return null;
    }

    @Override
    public void delete(Long id, CTMUser user) {

    }

    @Override
    public TaskAssignment create(TaskAssignment taskAssignment, CTMUser user) {
        return null;
    }
}
