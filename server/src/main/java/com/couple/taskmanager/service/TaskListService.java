package com.couple.taskmanager.service;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskAssignment;
import com.couple.taskmanager.model.TaskList;
import com.couple.taskmanager.model.TaskPeriod;
import com.couple.taskmanager.repository.ITaskPeriodRepository;
import com.couple.taskmanager.repository.TaskAssignmentRepository;
import com.couple.taskmanager.repository.TaskListRepository;
import com.couple.taskmanager.repository.TaskRepository;
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.MethodNotAllowedException;

import java.util.Date;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class TaskListService implements IGenericService<TaskList> {
    @Autowired
    TaskListRepository taskListRepository;
    @Autowired
    TaskRepository taskRepository;


    @Override
    public TaskList get(Long id) {
        throw new IllegalArgumentException();
    }

    public TaskList get(Assignee assignee) {
        return taskListRepository.findByAssignee(assignee);
    }

    @Override
    public List<TaskList> list() {
        return taskListRepository.findAll();
    }

    @Override
    public TaskList update(Long id, TaskList taskList) {
        return null;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        taskListRepository.deleteById(id);
    }

    @Override
    public void create(TaskList taskList) {
        taskListRepository.save(taskList);
    }

    public void addTasksToExistingList(Assignee assignee, List<Long> taskIds){
        TaskList existingTasks = taskListRepository.findByAssignee(assignee);

        if (existingTasks != null) {
            List<Task> newTasks = taskRepository.findAllById(taskIds);
            existingTasks.setTasks(newTasks); // Completely replace the existing tasks
            taskListRepository.save(existingTasks);
        }
    }
}
