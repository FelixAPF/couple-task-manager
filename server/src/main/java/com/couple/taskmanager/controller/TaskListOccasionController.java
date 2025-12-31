package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.TaskListOccasion;
import com.couple.taskmanager.model.dto.AssigneeDto;
import com.couple.taskmanager.model.dto.TaskListOccasionDto;
import com.couple.taskmanager.service.TaskListOccasionService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/task-list-occasions")
public class TaskListOccasionController extends GenericController<TaskListOccasion, TaskListOccasionDto, TaskListOccasionService> {
    @PostMapping("/{id}/add-task/{taskId}")
    public void addTask(@PathVariable("id") Long taskListOccasionId, @PathVariable("taskId") Long taskId, @RequestBody AssigneeDto assigneeId, @AuthenticationPrincipal UserDetails userDetails){
        service.createAndAddTaskAssignment(taskListOccasionId, taskId, assigneeId.getAssigneeId(), (CTMUser) userDetails);
    }
}
