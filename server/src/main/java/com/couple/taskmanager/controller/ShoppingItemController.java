package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.*;
import com.couple.taskmanager.model.dto.ShoppingItemDto;
import com.couple.taskmanager.service.ShoppingItemService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/shopping-list")
public class ShoppingItemController extends GenericController<ShoppingItem, ShoppingItemDto, ShoppingItemService> {
    @GetMapping("/name/suggestions")
    public List<String> getSuggestions() {
        return service.listNameSuggestions();
    }

    @GetMapping("/not-bought")
    public List<ShoppingItemDto> listNotBought(@AuthenticationPrincipal UserDetails userDetails){
        return service.listByNotBought((CTMUser) userDetails);
    }

    @PutMapping("/{id}/quantity")
    public void updateQuantity(@PathVariable("id") Long id, @RequestBody Double newQuantity, @AuthenticationPrincipal UserDetails userDetails){
        service.updateQuantity(id, newQuantity, (CTMUser) userDetails);
    }


}
