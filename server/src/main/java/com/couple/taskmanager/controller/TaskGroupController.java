package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.dto.TaskGroupDto;
import com.couple.taskmanager.service.TaskGroupService;
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/task-groups")
public class TaskGroupController {

    @Autowired
    private TaskGroupService service;

    @GetMapping
    public List<TaskGroupDto> getGroups(@AuthenticationPrincipal UserDetails user) {
        return service.getGroups((CTMUser) user);
    }

    @PostMapping
    public TaskGroupDto createGroup(@RequestBody Map<String, Object> payload, @AuthenticationPrincipal UserDetails user) {
        String name = (String) payload.get("name");
        List<Long> taskIds = StreamUtils.mapToList((List<Integer>) payload.get("taskIds"), Integer::longValue);
        return service.createGroup(name, taskIds, (CTMUser) user);
    }

    @DeleteMapping("/{id}")
    public void deleteGroup(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        service.deleteGroup(id, (CTMUser) user);
    }

    @PostMapping("/{id}/trigger")
    public void triggerGroup(@PathVariable Long id, @RequestBody Map<String, Date> payload, @AuthenticationPrincipal UserDetails user) {
        service.triggerGroup(id, payload.get("targetDate"), (CTMUser) user);
    }

    @PutMapping("/{id}")
    public TaskGroupDto updateGroup(@PathVariable Long id, @RequestBody Map<String, Object> payload, @AuthenticationPrincipal UserDetails user) {
        String name = (String) payload.get("name");
        List<Long> taskIds = StreamUtils.mapToList((List<Integer>) payload.get("taskIds"), Integer::longValue);
        return service.updateGroup(id, name, taskIds, (CTMUser) user);
    }
}