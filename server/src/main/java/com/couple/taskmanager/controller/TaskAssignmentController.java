package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.TaskListOccasion;
import com.couple.taskmanager.model.dto.AssigneeDto;
import com.couple.taskmanager.model.dto.TaskListOccasionDto;
import com.couple.taskmanager.service.TaskAssignmentService;
import com.couple.taskmanager.service.TaskListOccasionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/task-assignments")
public class TaskAssignmentController {
    @Autowired
    private TaskAssignmentService taskAssignmentService;

    @DeleteMapping("/{id}")
    public void deleteTaskAssignment(@PathVariable("id") Long id, @AuthenticationPrincipal UserDetails userDetails){
        CTMUser user = (CTMUser)userDetails;
        taskAssignmentService.delete(id, user.getHousehold().getId(), user);
    }

    @PutMapping("/{id}/reassign/{assigneeId}")
    public void reassignTaskAssignment(@PathVariable("id") Long id, @PathVariable("assigneeId") Long assigneeId, @AuthenticationPrincipal UserDetails userDetails){
        CTMUser user = (CTMUser)userDetails;
        taskAssignmentService.reassignTaskAssignment(id, assigneeId, user);
    }
}
