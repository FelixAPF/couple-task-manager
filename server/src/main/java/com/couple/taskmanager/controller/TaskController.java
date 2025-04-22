package com.couple.taskmanager.controller;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskAssignment;
import com.couple.taskmanager.model.dto.*;
import com.couple.taskmanager.model.TaskPeriod;
import com.couple.taskmanager.service.TaskService;
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/tasks")
public class TaskController extends GenericController<Task, TaskService> {

    @GetMapping("/keep-alive")
    public String keepAlive(){
        return "alive";
    }

    @PostMapping("/create")
    public Task createTask(@RequestBody CreateTaskV1 rqst,  @AuthenticationPrincipal UserDetails userDetails){
        return this.service.createRqst(rqst, (CTMUser) userDetails);
    }

    @PostMapping("by-date")
    public List<TaskPeriod> retrieveTasksByDate(@RequestBody Date date,  @AuthenticationPrincipal UserDetails userDetails){
        return service.retrieveTasksByDate(date, (CTMUser) userDetails);
    }

    @GetMapping("by-date/{completedDate}")
    public List<TaskAssignmentDto> retrieveTaskAssignmentsByDate(@PathVariable("completedDate") Date date, @AuthenticationPrincipal UserDetails userDetails){
        return service.retrieveTaskAssignmentsByDate(date, (CTMUser) userDetails);
    }

    @GetMapping("by-assignee/{assignee}/{date}")
    public List<TaskAssignmentDto> retrieveTasksByDate(@PathVariable Assignee assignee, @PathVariable Date date, @RequestParam("frequency") Frequency frequency, @AuthenticationPrincipal UserDetails userDetails){
        return StreamUtils.mapToList(service.retrieveIncompleteTasksByAssignee(assignee, date, frequency, (CTMUser) userDetails), TaskAssignmentDto::new);
    }

    @PostMapping("complete-assignment/{assignmentId}")
    public void completeTask(@PathVariable("assignmentId") Long assignmentId, @AuthenticationPrincipal UserDetails userDetails){
        service.completeTask(assignmentId, (CTMUser) userDetails);
    }

    @PostMapping("quick-complete/{taskId}")
    public Long completeTask(@PathVariable("taskId") Long taskId, @RequestBody QuickCompleteRqstV1 rqst, @AuthenticationPrincipal UserDetails userDetails){
        return service.quickCompleteTask(taskId, rqst.getAssignee(), (CTMUser) userDetails);
    }

    @GetMapping("{taskId}/history")
    public TaskHistoryDto retrieveTaskHistory(@PathVariable("taskId") Long taskId, @AuthenticationPrincipal UserDetails userDetails){
        return service.getTaskHistory(taskId, (CTMUser) userDetails);
    }

    @GetMapping("not-completed-in-long-time")
    public List<TaskWithCompletedDateV1> retrieveTasksNotCompletedInLongTime(@AuthenticationPrincipal UserDetails userDetails){
        return service.retrieveTasksNotCompletedInLongTime((CTMUser) userDetails);
    }

    @GetMapping("{taskId}/assignments-by-id")
    public List<TaskAssignmentDto> retrieveTaskAssignmentsFromTaskId(@PathVariable("taskId") Long taskId, @AuthenticationPrincipal UserDetails userDetails){
        return service.listTaskAssignments(taskId, (CTMUser) userDetails);
    }

    @GetMapping("completed/{completed}")
    public List<TaskAssignmentDto> retrieveTaskAssignmentsFromCompleted(@PathVariable("completed") Boolean completed, @AuthenticationPrincipal UserDetails userDetails){
        return service.list(completed, (CTMUser) userDetails);
    }

}
