package com.couple.taskmanager.service;

import com.couple.taskmanager.model.Ingredient;
import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.model.ShoppingItem;
import com.couple.taskmanager.repository.IngredientRepository;
import com.couple.taskmanager.repository.RecipeRepository;
import com.couple.taskmanager.repository.ShoppingItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class RecipeService implements IGenericService<Recipe> {
    @Autowired
    RecipeRepository repository;


    @Override
    public Recipe get(Long id) {
        return repository.findById(id).orElseThrow(() -> new NoSuchElementException("No recipe with id " + id + " found"));
    }

    @Override
    public List<Recipe> list() {
        return repository.findAll();
    }

    @Override
    public Recipe update(Long id, Recipe recipe) {
        if(!repository.existsById(id)){
            throw new NoSuchElementException("No recipe with id " + id);
        }
        return this.repository.save(recipe);
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Override
    public Recipe create(Recipe recipe) {
        return repository.save(recipe);
    }


    public List<Recipe> create(List<Recipe> recipes) {
        return repository.saveAll(recipes);
    }

    public List<Recipe> findByRecipeType(String recipeType) {
        return repository.findByRecipeType(recipeType);
    }
}
