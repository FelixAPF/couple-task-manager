package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.repository.RecipeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class RecipeService implements IGenericService<Recipe> {
    @Autowired
    RecipeRepository repository;


    @Override
    public Recipe get(Long id, Long householdId, CTMUser user) {
        return repository.findById(id).orElseThrow(() -> new NoSuchElementException("No recipe with id " + id + " found"));
    }

    @Override
    public List<Recipe> list(Long householdId, CTMUser user) {
        return repository.findAllByHouseholdId(user.getHousehold().getId());
    }

    @Override
    public Recipe update(Long id, Recipe recipe, CTMUser user) {
        if(!repository.existsById(id)){
            throw new NoSuchElementException("No recipe with id " + id);
        }
        return this.repository.save(recipe);
    }

    @Override
    public void delete(Long id, Long householdId, CTMUser user) {
        repository.deleteByRecipeIdAndHouseholdId(id, householdId);
    }

    @Override
    public Recipe create(Recipe recipe, CTMUser user) {
        if(recipe.getHousehold() == null){
            recipe.setHousehold(user.getHousehold());
        }
        return repository.save(recipe);
    }


    public List<Recipe> create(List<Recipe> recipes, CTMUser user) {
        recipes.forEach(recipe -> {
            if(recipe.getHousehold() == null){
                recipe.setHousehold(user.getHousehold());
            }
        });
        return repository.saveAll(recipes);
    }

    public List<Recipe> findByRecipeType(String recipeType, CTMUser user) {
        return repository.findByRecipeTypeAndHouseholdId(recipeType, user.getHousehold().getId());
    }
}
