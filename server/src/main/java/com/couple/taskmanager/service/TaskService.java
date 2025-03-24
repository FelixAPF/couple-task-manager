package com.couple.taskmanager.service;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskAssignment;
import com.couple.taskmanager.model.TaskPeriod;
import com.couple.taskmanager.repository.ITaskPeriodRepository;
import com.couple.taskmanager.repository.TaskAssignmentRepository;
import com.couple.taskmanager.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class TaskService implements IGenericService<Task> {
    @Autowired
    TaskRepository taskRepository;
    @Autowired
    ITaskPeriodRepository taskPeriodRepository;
    @Autowired
    TaskAssignmentRepository taskAssignmentRepository;

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
    @Transactional
    public void delete(Long id) {
        List<TaskAssignment> allByTaskId = this.taskAssignmentRepository.findAllByTaskId(id);
        for (TaskAssignment taskAssignment : allByTaskId) {
            taskAssignmentRepository.delete(taskAssignment);
        }

        taskRepository.deleteById(id);
    }

    @Override
    public void create(Task task) {
        taskRepository.save(task);
    }

    public List<TaskPeriod> retrieveTasksByDate(Date date){
        return taskPeriodRepository.retrieveTasksInPeriod(date);
    }

    public List<TaskAssignment> retrieveIncompleteTasksByAssignee(Assignee assignee, Date date, Frequency frequency){
        date.setTime(date.getTime() + (long) frequency.getDaysAmount() * 24 * 60 * 60 * 1000);
        return taskAssignmentRepository.findAllByCompletedFalseAndAssigneeAndDueDateLessThanEqual(assignee, date);
    }

    public void completeTask(Long assignmentId) {
        taskAssignmentRepository.setAssignmentCompleted(assignmentId, true);

        TaskPeriod taskPeriod = taskPeriodRepository.findByTaskAssignmentId(assignmentId);
        boolean isTaskPeriodCompleted = taskPeriod.getTaskAssignments().stream().allMatch(TaskAssignment::getCompleted);
        if(isTaskPeriodCompleted){
            taskPeriodRepository.markAsCompleted(taskPeriod.getId());
        }
    }
}
