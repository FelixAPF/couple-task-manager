package com.couple.taskmanager.service;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskAssignment;
import com.couple.taskmanager.model.TaskList;
import com.couple.taskmanager.model.TaskPeriod;
import com.couple.taskmanager.model.dto.TaskAssignmentDto;
import com.couple.taskmanager.model.dto.TaskWithCompletedDateV1;
import com.couple.taskmanager.repository.ITaskPeriodRepository;
import com.couple.taskmanager.repository.TaskAssignmentRepository;
import com.couple.taskmanager.repository.TaskListRepository;
import com.couple.taskmanager.repository.TaskRepository;
import com.couple.taskmanager.utils.DateUtils;
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class TaskAssignmentService implements IGenericService<TaskAssignment> {
    @Autowired
    TaskAssignmentRepository taskAssignmentRepository;


    @Override
    public TaskAssignment get(Long id) {
        return taskAssignmentRepository.findById(id).orElseThrow(NoSuchElementException::new);
    }

    @Override
    public List<TaskAssignment> list() {
        return taskAssignmentRepository.findAll();
    }

    public List<TaskAssignmentDto> list(Long taskId){
        return StreamUtils.ofNullable(taskAssignmentRepository.findAllByTaskIdAndCompletedTrue(taskId))
                .map(TaskAssignmentDto::new)
                .toList();
    }

    @Override
    public TaskAssignment update(Long id, TaskAssignment taskAssignment) {
        return null;
    }

    @Override
    public void delete(Long id) {

    }

    @Override
    public TaskAssignment create(TaskAssignment taskAssignment) {
        return null;
    }
}
