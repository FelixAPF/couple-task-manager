package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.TaskPeriod;
import com.couple.taskmanager.model.dto.PeriodCreationRqstV1;
import com.couple.taskmanager.service.TaskPeriodService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/task-periods")
@CrossOrigin("*")
public class TaskPeriodController extends GenericController<TaskPeriod, TaskPeriodService> {
    @PostMapping("/creation")
    public void startPeriodCreation(@RequestBody PeriodCreationRqstV1 request){
        service.createPeriodAutomatically(request);
    }

    @GetMapping("/incomplete")
    public List<TaskPeriod> findALlIncompletePeriod(){
        return service.listIncomplete();
    }
}
