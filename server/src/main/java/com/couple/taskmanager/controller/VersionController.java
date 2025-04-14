package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.service.RecipeService;
import com.couple.taskmanager.service.VersionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/version")
@CrossOrigin("*")
public class VersionController {
    @Autowired
    VersionService service;

    @GetMapping()
    public String getVersionNumber(){
        return service.get();
    }
}
