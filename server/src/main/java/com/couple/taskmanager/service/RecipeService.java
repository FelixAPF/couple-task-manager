package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.model.dto.RecipeDto;
import com.couple.taskmanager.repository.RecipeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class RecipeService implements IGenericService<Recipe, RecipeDto> {
    @Autowired
    RecipeRepository repository;


    @Override
    public RecipeDto get(Long id, Long householdId, CTMUser user) {
        return repository.findById(id).map(RecipeDto::new).orElseThrow(() -> new NoSuchElementException("No recipe with id " + id + " found"));
    }

    @Override
    public List<RecipeDto> list(Long householdId, CTMUser user) {
        return repository.findAllByHouseholdId(user.getHousehold().getId()).stream().map(RecipeDto::new).toList();
    }

    @Override
    public RecipeDto update(Long id, Recipe recipe, CTMUser user) {
        if(!repository.existsById(id)){
            throw new NoSuchElementException("No recipe with id " + id);
        }
        return new RecipeDto(this.repository.save(recipe));
    }

    @Override
    public void delete(Long id, Long householdId, CTMUser user) {
        repository.deleteByRecipeIdAndHouseholdId(id, householdId);
    }

    @Override
    public RecipeDto create(Recipe recipe, CTMUser user) {
        if(recipe.getHousehold() == null){
            recipe.setHousehold(user.getHousehold());
        }
        return new RecipeDto(repository.save(recipe));
    }


    public List<RecipeDto> create(List<Recipe> recipes, CTMUser user) {
        recipes.forEach(recipe -> {
            if(recipe.getHousehold() == null){
                recipe.setHousehold(user.getHousehold());
            }
        });
        return repository.saveAll(recipes).stream().map(RecipeDto::new).toList();
    }

    public List<RecipeDto> findByRecipeType(String recipeType, CTMUser user) {
        return repository.findByRecipeTypeAndHouseholdId(recipeType, user.getHousehold().getId()).stream().map(RecipeDto::new).toList();
    }
}
