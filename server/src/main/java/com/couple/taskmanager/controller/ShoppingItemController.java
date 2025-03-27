package com.couple.taskmanager.controller;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.model.ShoppingItem;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskAssignment;
import com.couple.taskmanager.model.TaskPeriod;
import com.couple.taskmanager.model.dto.TaskAssignmentDto;
import com.couple.taskmanager.model.dto.TaskWithCompletedDateV1;
import com.couple.taskmanager.service.ShoppingItemService;
import com.couple.taskmanager.service.TaskService;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/shopping-list")
@CrossOrigin("*")
public class ShoppingItemController extends GenericController<ShoppingItem, ShoppingItemService> {
    @GetMapping("/name/suggestions")
    public List<String> getSuggestions() {
        return service.listNameSuggestions();
    }

    @GetMapping("/not-bought")
    public List<ShoppingItem> listNotBought(){
        return service.listByNotBought();
    }


}
