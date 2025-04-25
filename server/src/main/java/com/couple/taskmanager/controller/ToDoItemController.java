package com.couple.taskmanager.controller;

import com.couple.taskmanager.enums.ToDoStatus;
import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.ToDoItem;
import com.couple.taskmanager.model.WayToCare;
import com.couple.taskmanager.model.dto.ToDoItemDto;
import com.couple.taskmanager.service.ToDoListService;
import jakarta.websocket.server.PathParam;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/to-do-list")
public class ToDoItemController extends GenericController<ToDoItem, ToDoItemDto, ToDoListService> {

    @PutMapping("/{toDoItemId}/status/{toDoStatus}")
    public void updateStatus(@PathVariable("toDoItemId") Long toDoItemId, @PathVariable("toDoStatus") String toDoStatus,  @AuthenticationPrincipal UserDetails userDetails){
        CTMUser user = (CTMUser)userDetails;
        service.updateStatus(toDoItemId,  ToDoStatus.valueOf(toDoStatus), user);
    }

    @PutMapping("/{toDoItemId}/rate/{rating}")
    public void rateAndCompleteItem(@PathVariable("toDoItemId") Long toDoItemId, @PathVariable("rating") double rating,  @AuthenticationPrincipal UserDetails userDetails){
        CTMUser user = (CTMUser)userDetails;
        service.rateAndCompleteItem(toDoItemId, rating, user);
    }

}
