package com.couple.taskmanager.controller;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.model.*;
import com.couple.taskmanager.model.dto.TaskAssignmentDto;
import com.couple.taskmanager.model.dto.TaskWithCompletedDateV1;
import com.couple.taskmanager.service.ShoppingItemService;
import com.couple.taskmanager.service.TaskService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/shopping-list")
public class ShoppingItemController extends GenericController<ShoppingItem, ShoppingItemService> {
    @GetMapping("/name/suggestions")
    public List<String> getSuggestions() {
        return service.listNameSuggestions();
    }

    @GetMapping("/not-bought")
    public List<ShoppingItem> listNotBought(@AuthenticationPrincipal UserDetails userDetails){
        return service.listByNotBought((CTMUser) userDetails);
    }


}
