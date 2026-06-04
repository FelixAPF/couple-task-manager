package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskList;
import com.couple.taskmanager.model.dto.BasicTaskAssignmentRqstV1;
import com.couple.taskmanager.model.dto.TaskListDto;
import com.couple.taskmanager.repository.CTMUserRepository;
import com.couple.taskmanager.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class TaskListService implements IGenericService<TaskList, TaskListDto> {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private CTMUserRepository userRepository;

    @Override
    public TaskListDto get(Long id, Long householdId, CTMUser user) { return null; }

    @Override
    public List<TaskListDto> list(Long householdId, CTMUser user) { return new ArrayList<>(); }

    @Override
    public TaskListDto update(Long id, TaskList taskList, CTMUser user) { return null; }

    @Override
    public void delete(Long id, Long householdId, CTMUser user) { }

    @Override
    public TaskListDto create(TaskList taskList, CTMUser user) { return null; }

    @Transactional
    public void moveTaskToNewAssignee(Long taskId, Long userId, CTMUser user){
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new NoSuchElementException("Task not found"));
        CTMUser newUser = userRepository.findById(userId).orElseThrow(() -> new NoSuchElementException("User not found"));

        // Much simpler now: Just set the assignee directly on the task!
        task.setAssignee(newUser);
        taskRepository.save(task);
    }

    @Transactional
    public void addTasksToExistingList(List<BasicTaskAssignmentRqstV1> taskWithIds, CTMUser user) {
        for (BasicTaskAssignmentRqstV1 rqst : taskWithIds) {
            Task task = taskRepository.findById(rqst.getTaskId()).orElse(null);
            if (task != null && task.getHousehold().getId().equals(user.getHousehold().getId())) {
                if (rqst.getAssigneeUserId() != null && rqst.getAssigneeUserId() != 0) {
                    CTMUser assignee = userRepository.findById(rqst.getAssigneeUserId()).orElse(null);
                    task.setAssignee(assignee);
                } else {
                    // 0 or null means unassigned
                    task.setAssignee(null);
                }
                taskRepository.save(task);
            }
        }
    }
}