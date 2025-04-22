package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.model.ShoppingItem;
import com.couple.taskmanager.service.RecipeService;
import com.couple.taskmanager.service.ShoppingItemService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/recipes")
public class RecipeController extends GenericController<Recipe, RecipeService> {

    @PostMapping("/batch")
    public List<Recipe> batchSave(@RequestBody List<Recipe> recipes, @AuthenticationPrincipal UserDetails userDetails){
        return this.service.create(recipes, (CTMUser) userDetails);
    }

    @GetMapping("/type/{recipeType}")
    public List<Recipe> findByRecipeType(@PathVariable String recipeType, @AuthenticationPrincipal UserDetails userDetails) {
        return this.service.findByRecipeType(recipeType, (CTMUser) userDetails);
    }
}
