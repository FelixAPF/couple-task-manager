package com.couple.taskmanager.controller;


import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.service.IGenericService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

//T - Model, D - DTO, S - Service
@RestController
public abstract class GenericController<T, D, S extends IGenericService<T, D>> {
    @Autowired
    protected S service;

    @GetMapping("/{id}")
    D retrieve(@PathVariable("id") Long id, @AuthenticationPrincipal UserDetails userDetails){
        CTMUser user = (CTMUser)userDetails;
        return service.get(id, user.getHousehold().getId(), user);
    }

    @GetMapping
    List<D> retrieveList(@AuthenticationPrincipal UserDetails userDetails){
        CTMUser user = (CTMUser)userDetails;
        return service.list(user.getHousehold().getId(), (CTMUser)userDetails);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    D create(@RequestBody T t,@AuthenticationPrincipal UserDetails userDetails){
        CTMUser user = (CTMUser)userDetails;
        return service.create(t, user);
    }

    @PutMapping("/{id}")
    D update(@PathVariable("id") Long id, @RequestBody T t, @AuthenticationPrincipal UserDetails userDetails){
        CTMUser user = (CTMUser)userDetails;
        return service.update(id, t, user);
    }

    @DeleteMapping("/{id}")
    void delete(@PathVariable("id") Long id,@AuthenticationPrincipal UserDetails userDetails){
        CTMUser user = (CTMUser)userDetails;
        service.delete(id, user.getHousehold().getId(), (CTMUser)userDetails);
    }
}
