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
public class TaskAssignmentService implements IGenericService<TaskAssignment, TaskAssignmentDto> {
    @Autowired
    TaskAssignmentRepository taskAssignmentRepository;


    @Override
    public TaskAssignmentDto get(Long id, Long householdId, CTMUser user) {
        return taskAssignmentRepository.findById(id).map(TaskAssignmentDto::new).orElseThrow(NoSuchElementException::new);
    }

    @Override
    public List<TaskAssignmentDto> list(Long householdId, CTMUser user) {
        return StreamUtils.mapToList(taskAssignmentRepository.findAll(), TaskAssignmentDto::new);
    }

    public List<TaskAssignmentDto> listDto(Long taskId, CTMUser user){
        return StreamUtils.ofNullable(taskAssignmentRepository.findAllByTaskIdAndCompletedTrueAndHouseholdId(taskId, user.getHousehold().getId()))
                .map(TaskAssignmentDto::new)
                .toList();
    }

    @Override
    public TaskAssignmentDto update(Long id, TaskAssignment taskAssignment, CTMUser user) {
        return null;
    }

    @Override
    public void delete(Long id, Long householdId, CTMUser user) {

    }

    @Override
    public TaskAssignmentDto create(TaskAssignment taskAssignment, CTMUser user) {
        return null;
    }
}
