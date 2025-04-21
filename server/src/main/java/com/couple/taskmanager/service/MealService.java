package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Meal;
import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.repository.MealRepository;
import com.couple.taskmanager.repository.RecipeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class MealService implements IGenericService<Meal> {
    @Autowired
    MealRepository repository;
    @Autowired
    RecipeRepository recipeRepository;


    @Override
    public Meal get(Long id, CTMUser user) {
        return repository.findById(id).orElseThrow(() -> new NoSuchElementException("No recipe with id " + id + " found"));
    }

    @Override
    public List<Meal> list(CTMUser user) {
        return repository.findAll();
    }

    @Override
    public Meal update(Long id, Meal meal, CTMUser user) {
        return null;
    }

    @Override
    public void delete(Long id, CTMUser user) {
        repository.deleteById(id);
    }

    @Override
    public Meal create(Meal meal, CTMUser user) {
        Recipe recipe = meal.getRecipe();
        Optional<Recipe> byId = recipeRepository.findById(recipe.getId());
        if(byId.isEmpty()){
            recipe = recipeRepository.save(recipe);
        }
        Meal newMeal = new Meal();
        newMeal.setDate(meal.getDate());
        newMeal.setLocation(meal.getLocation());
        newMeal.setRecipe(byId.orElse(recipe));
        return repository.save(meal);
    }

    public List<Meal> retrieveByDateRange(long startDateMillis, long endDateMillis) {
        Date startDate = new Date(startDateMillis);
        Date endDate = new Date(endDateMillis);
        return repository.findByDateBetween(startDate, endDate);
    }

    public Meal retrieveByDate(Date date) {
        return repository.findByDate(date);
    }
}
