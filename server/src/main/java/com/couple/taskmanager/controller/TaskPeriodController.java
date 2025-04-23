package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.TaskPeriod;
import com.couple.taskmanager.model.dto.PeriodCreationRqstV1;
import com.couple.taskmanager.model.dto.TaskPeriodDto;
import com.couple.taskmanager.service.TaskPeriodService;
import jakarta.transaction.SystemException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/task-periods")
public class TaskPeriodController extends GenericController<TaskPeriod, TaskPeriodDto, TaskPeriodService> {
    @PostMapping("/creation")
    public TaskPeriodDto startPeriodCreation(@RequestBody PeriodCreationRqstV1 request, @AuthenticationPrincipal UserDetails userDetails) throws SystemException {
        return service.createPeriod(request, (CTMUser) userDetails);
    }

    @GetMapping("/incomplete")
    public List<TaskPeriodDto> findALlIncompletePeriod(@AuthenticationPrincipal UserDetails userDetails){
        return service.listIncomplete((CTMUser) userDetails);
    }
}
