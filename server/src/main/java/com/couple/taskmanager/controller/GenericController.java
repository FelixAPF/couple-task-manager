package com.couple.taskmanager.controller;


import com.couple.taskmanager.service.IGenericService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public abstract class GenericController<T, S extends IGenericService<T>> {
    @Autowired
    protected S service;

    @GetMapping("/{id}")
    T retrieve(@PathVariable("id") Long id){
        return service.get(id);
    }

    @GetMapping
    List<T> retrieveList(){
        return service.list();
    }

    @PostMapping
    T create(@RequestBody T t){
        return service.create(t);
    }

    @PutMapping("/{id}")
    T update(@PathVariable("id") Long id, @RequestBody T t){
        return service.update(id, t);
    }

    @DeleteMapping("/{id}")
    void delete(@PathVariable("id") Long id){
        service.delete(id);
    }
}
