package com.couple.taskmanager.service;

import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.*;

@Service
public class TaskService implements IGenericService<Task> {
    @Autowired
    TaskRepository taskRepository;

    @Override
    public Task get(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No task with id " + id));
    }

    @Override
    public List<Task> list() {
        return taskRepository.findAll();
    }

    @Override
    public Task update(Long id, Task task) {
        return taskRepository.save(task);
    }

    @Override
    public void delete(Long id) {
        taskRepository.deleteById(id);
    }

    @Override
    public void create(Task task) {
        taskRepository.save(task);
    }
}
