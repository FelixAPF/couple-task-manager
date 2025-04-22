package com.couple.taskmanager.controller;


import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.service.IGenericService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public abstract class GenericController<T, S extends IGenericService<T>> {
    @Autowired
    protected S service;

    @GetMapping("/{id}")
    T retrieve(@PathVariable("id") Long id, @AuthenticationPrincipal UserDetails userDetails){
        CTMUser user = (CTMUser)userDetails;
        return service.get(id, user.getHousehold().getId(), user);
    }

    @GetMapping
    List<T> retrieveList(@AuthenticationPrincipal UserDetails userDetails){
        CTMUser user = (CTMUser)userDetails;
        return service.list(user.getHousehold().getId(), (CTMUser)userDetails);
    }

    @PostMapping
    T create(@RequestBody T t,@AuthenticationPrincipal UserDetails userDetails){
        CTMUser user = (CTMUser)userDetails;
        return service.create(t, user);
    }

    @PutMapping("/{id}")
    T update(@PathVariable("id") Long id, @RequestBody T t, @AuthenticationPrincipal UserDetails userDetails){
        CTMUser user = (CTMUser)userDetails;
        return service.update(id, t, user);
    }

    @DeleteMapping("/{id}")
    void delete(@PathVariable("id") Long id,@AuthenticationPrincipal UserDetails userDetails){
        CTMUser user = (CTMUser)userDetails;
        service.delete(id, user.getHousehold().getId(), (CTMUser)userDetails);
    }
}
