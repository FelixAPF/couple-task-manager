package com.couple.taskmanager.controller;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskAssignment;
import com.couple.taskmanager.model.dto.QuickCompleteRqstV1;
import com.couple.taskmanager.model.dto.TaskAssignmentDto;
import com.couple.taskmanager.model.TaskPeriod;
import com.couple.taskmanager.model.dto.TaskWithCompletedDateV1;
import com.couple.taskmanager.service.TaskService;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/tasks")
@CrossOrigin("*")
public class TaskController extends GenericController<Task, TaskService> {

    @PostMapping("by-date")
    public List<TaskPeriod> retrieveTasksByDate(@RequestBody Date date){
        return service.retrieveTasksByDate(date);
    }

    @GetMapping("by-date/{completedDate}")
    public List<TaskAssignment> retrieveTaskAssignmentsByDate(@PathVariable("completedDate") Date date){
        return service.retrieveTaskAssignmentsByDate(date);
    }

    @GetMapping("by-assignee/{assignee}/{date}")
    public List<TaskAssignmentDto> retrieveTasksByDate(@PathVariable Assignee assignee, @PathVariable Date date, @RequestParam("frequency") Frequency frequency){
        List<TaskAssignment> taskAssignments = service.retrieveIncompleteTasksByAssignee(assignee, date, frequency);
        return taskAssignments.stream().map(TaskAssignmentDto::new).collect(Collectors.toList());
    }

    @PostMapping("complete-assignment/{assignmentId}")
    public void completeTask(@PathVariable("assignmentId") Long assignmentId){
        service.completeTask(assignmentId);
    }
    @PostMapping("quick-complete/{taskId}")
    public Long completeTask(@PathVariable("taskId") Long taskId, @RequestBody QuickCompleteRqstV1 rqst){
        return service.quickCompleteTask(taskId, rqst.getAssignee());
    }


    @GetMapping("not-completed-in-long-time")
    public List<TaskWithCompletedDateV1> retrieveTasksNotCompletedInLongTime(){
        return service.retrieveTasksNotCompletedInLongTime();
    }
}
