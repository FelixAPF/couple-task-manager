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
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/tasks")
@CrossOrigin("*")
public class TaskController extends GenericController<Task, TaskService> {

    @GetMapping("/keep-alive")
    public String keepAlive(){
        return "alive";
    }

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
        return StreamUtils.mapToList(service.retrieveIncompleteTasksByAssignee(assignee, date, frequency), TaskAssignmentDto::new);
    }

    @PostMapping("complete-assignment/{assignmentId}")
    public void completeTask(@PathVariable("assignmentId") Long assignmentId){
        service.completeTask(assignmentId);
    }

    @PostMapping("quick-complete/{taskId}")
    public Long completeTask(@PathVariable("taskId") Long taskId, @RequestBody QuickCompleteRqstV1 rqst){
        return service.quickCompleteTask(taskId, rqst.getAssignee());
    }

    @GetMapping("{taskId}/history")
    public List<TaskAssignmentDto> retrieveTaskHistory(@PathVariable("taskId") Long taskId){
        return service.list(taskId);
    }

    @GetMapping("not-completed-in-long-time")
    public List<TaskWithCompletedDateV1> retrieveTasksNotCompletedInLongTime(){
        return service.retrieveTasksNotCompletedInLongTime();
    }

    @GetMapping("{taskId}/assignments-by-id")
    public List<TaskAssignmentDto> retrieveTaskAssignmentsFromTaskId(@PathVariable("taskId") Long taskId){
        return service.list(taskId);
    }

    @GetMapping("completed/{completed}")
    public List<TaskAssignmentDto> retrieveTaskAssignmentsFromCompleted(@PathVariable("completed") Boolean completed){
        return service.list(completed);
    }

}
