package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.model.ShoppingItem;
import com.couple.taskmanager.service.RecipeService;
import com.couple.taskmanager.service.ShoppingItemService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/recipes")
@CrossOrigin("*")
public class RecipeController extends GenericController<Recipe, RecipeService> {

    @PostMapping("/batch")
    public List<Recipe> batchSave(@RequestBody List<Recipe> recipes){
        return this.service.create(recipes);
    }
}
