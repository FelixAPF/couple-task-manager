package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.TaskList;
import com.couple.taskmanager.model.dto.BasicTaskAssignmentRqstV1;
import com.couple.taskmanager.model.dto.TaskListDto;
import com.couple.taskmanager.model.dto.TaskListRequestV1;
import com.couple.taskmanager.service.TaskListService;
import jakarta.transaction.SystemException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/task-list")
public class TaskListController extends GenericController<TaskList, TaskListDto, TaskListService> {

    @GetMapping("/by-assignee/{assignee}")
    public List<TaskListDto> get(@PathVariable("assignee") Long assigneeUserId, @AuthenticationPrincipal UserDetails userDetails){
        return service.get(assigneeUserId, (CTMUser) userDetails);
    }

    @GetMapping("/with-unassigned")
    public List<TaskListDto> listWithUnassigned(@AuthenticationPrincipal UserDetails userDetails){
        return service.listWithUnassigned((CTMUser) userDetails);
    }

    @PostMapping("/assign")
    public void addTasksToExistingList(@RequestBody List<BasicTaskAssignmentRqstV1> taskWithIds, @AuthenticationPrincipal UserDetails userDetails) throws SystemException {
        service.addTasksToExistingList(taskWithIds, (CTMUser) userDetails);
    }

    @PostMapping("/unassign")
    public TaskListDto unassign(@RequestBody TaskListRequestV1 rqst){
        return service.unassign(rqst);
    }

    @PostMapping("/move/{taskId}/{assignee}")
    public void unassign(@PathVariable("taskId") Long taskId, @PathVariable("assignee") Long assigneeUserId, @AuthenticationPrincipal UserDetails userDetails){
        service.moveTaskToNewAssignee(taskId, assigneeUserId, (CTMUser) userDetails);
    }


}
