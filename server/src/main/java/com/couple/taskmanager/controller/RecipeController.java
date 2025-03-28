package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.model.ShoppingItem;
import com.couple.taskmanager.service.RecipeService;
import com.couple.taskmanager.service.ShoppingItemService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/recipes")
@CrossOrigin("*")
public class RecipeController extends GenericController<Recipe, RecipeService> {
}
