package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.dto.*;
import com.couple.taskmanager.service.TaskService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tasks")
public class TaskController extends GenericController<Task, TaskDto, TaskService> {

    @GetMapping("/keep-alive")
    public String keepAlive() {
        return "alive";
    }

    @PostMapping("/create")
    public TaskDto createTask(@RequestBody CreateTaskV1 rqst, @AuthenticationPrincipal UserDetails userDetails) {
        return this.service.createRqst(rqst, (CTMUser) userDetails);
    }

    @GetMapping("/{taskId}/history")
    public List<TaskHistoryDto> retrieveTaskHistory(@PathVariable Long taskId, @AuthenticationPrincipal UserDetails userDetails){
        return service.getTaskHistory(taskId, (CTMUser) userDetails);
    }



    @GetMapping("/dashboard")
    public List<TaskDto> getDashboardTasks(
            @RequestParam(value = "horizon", defaultValue = "MONTH") String horizon,
            @AuthenticationPrincipal UserDetails userDetails) {
        return service.getDashboardTasks(horizon, (CTMUser) userDetails);
    }

    @PostMapping("/{taskId}/complete")
    public TaskDto completeTask(@PathVariable Long taskId, @AuthenticationPrincipal UserDetails userDetails) {
        return service.completeTask(taskId, (CTMUser) userDetails);
    }

    @PostMapping("/{taskId}/skip")
    public TaskDto skipTask(@PathVariable Long taskId, @AuthenticationPrincipal UserDetails userDetails) {
        return service.skipTask(taskId, (CTMUser) userDetails);
    }

    @PutMapping("/{taskId}/reschedule")
    public TaskDto rescheduleTask(@PathVariable Long taskId, @RequestBody Map<String, Date> payload, @AuthenticationPrincipal UserDetails userDetails) {
        return service.rescheduleTask(taskId, payload.get("newDueDate"), (CTMUser) userDetails);
    }
}