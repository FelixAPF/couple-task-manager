package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.TaskList;
import com.couple.taskmanager.model.dto.BasicTaskAssignmentRqstV1;
import com.couple.taskmanager.model.dto.TaskListDto;
import com.couple.taskmanager.service.TaskListService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/task-lists")
public class TaskListController extends GenericController<TaskList, TaskListDto, TaskListService> {

    // Moves a task to a new assignee directly using the simplified logic
    @PutMapping("/move-task/{taskId}/user/{userId}")
    public void moveTaskToNewAssignee(
            @PathVariable Long taskId,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        service.moveTaskToNewAssignee(taskId, userId, (CTMUser) userDetails);
    }

    // Handles bulk assignments/unassignments
    @PostMapping("/add-tasks")
    public void addTasksToExistingList(
            @RequestBody List<BasicTaskAssignmentRqstV1> taskWithIds,
            @AuthenticationPrincipal UserDetails userDetails) {
        service.addTasksToExistingList(taskWithIds, (CTMUser) userDetails);
    }
}