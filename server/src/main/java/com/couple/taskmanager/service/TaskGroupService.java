package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskGroup;
import com.couple.taskmanager.model.dto.TaskGroupDto;
import com.couple.taskmanager.repository.TaskGroupRepository;
import com.couple.taskmanager.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class TaskGroupService {

    @Autowired
    private TaskGroupRepository groupRepository;

    @Autowired
    private TaskRepository taskRepository;

    public List<TaskGroupDto> getGroups(CTMUser user) {
        return groupRepository.findAllByHouseholdId(user.getHousehold().getId())
                .stream().map(TaskGroupDto::new).toList();
    }

    public TaskGroupDto createGroup(String name, List<Long> taskIds, CTMUser user) {
        TaskGroup group = new TaskGroup();
        group.setName(name);
        group.setHousehold(user.getHousehold());

        List<Task> tasks = taskRepository.findAllByIdInAndHouseholdId(new HashSet<>(taskIds), user.getHousehold().getId());
        group.setTasks(tasks);

        return new TaskGroupDto(groupRepository.save(group));
    }

    public void deleteGroup(Long groupId, CTMUser user) {
        TaskGroup group = groupRepository.findByIdAndHouseholdId(groupId, user.getHousehold().getId()).orElseThrow();
        groupRepository.delete(group);
    }

    @Transactional
    public void triggerGroup(Long groupId, Date targetDate, CTMUser user) {
        TaskGroup group = groupRepository.findByIdAndHouseholdId(groupId, user.getHousehold().getId()).orElseThrow();

        // Magically shift all tasks in this library to the target date!
        for (Task task : group.getTasks()) {
            task.setDueDate(targetDate);
            taskRepository.save(task);
        }
    }

    @Transactional
    public TaskGroupDto updateGroup(Long groupId, String name, List<Long> taskIds, CTMUser user) {
        TaskGroup group = groupRepository.findByIdAndHouseholdId(groupId, user.getHousehold().getId())
                .orElseThrow(() -> new NoSuchElementException("Group not found"));

        group.setName(name);
        List<Task> tasks = taskRepository.findAllByIdInAndHouseholdId(new HashSet<>(taskIds), user.getHousehold().getId());
        group.setTasks(tasks);

        return new TaskGroupDto(groupRepository.save(group));
    }
}