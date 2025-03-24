package com.couple.taskmanager.controller;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.model.TaskList;
import com.couple.taskmanager.model.dto.TaskListRequestV1;
import com.couple.taskmanager.service.TaskListService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/task-list")
@CrossOrigin("*")
public class TaskListController extends GenericController<TaskList, TaskListService> {

    @GetMapping("/by-assignee/{assignee}")
    public TaskList get(@PathVariable("assignee") Assignee assignee){
        return service.get(assignee);
    }

    @PostMapping("/{assignee}")
    public void addTasksToExistingList(@PathVariable("assignee") Assignee assignee, @RequestBody List<Long> taskIds){
        service.addTasksToExistingList(assignee, taskIds);
    }

    @PostMapping("/unassign")
    public TaskList unassign(@RequestBody TaskListRequestV1 rqst){
        return service.unassign(rqst);
    }

}
