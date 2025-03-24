package com.couple.taskmanager.controller;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskAssignment;
import com.couple.taskmanager.model.TaskPeriod;
import com.couple.taskmanager.service.TaskService;
import com.couple.taskmanager.utils.DateUtils;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/tasks")
@CrossOrigin("*")
public class TaskController extends GenericController<Task, TaskService> {

    @PostMapping("by-date")
    public List<TaskPeriod> retrieveTasksByDate(@RequestBody Date date){
        return service.retrieveTasksByDate(date);
    }

    @GetMapping("by-assignee/{assignee}/{date}")
    public List<TaskAssignment> retrieveTasksByDate(@PathVariable Assignee assignee, @PathVariable Date date){
        return service.retrieveIncompleteTasksByAssignee(assignee, date);
    }

    @PostMapping("complete-assignment")
    public void completeTask(@RequestBody Long assignmentId){
        service.completeTask(assignmentId);
    }
}
