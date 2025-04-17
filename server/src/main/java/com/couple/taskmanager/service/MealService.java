package com.couple.taskmanager.service;

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
    public Meal get(Long id) {
        return repository.findById(id).orElseThrow(() -> new NoSuchElementException("No recipe with id " + id + " found"));
    }

    @Override
    public List<Meal> list() {
        return repository.findAll();
    }

    @Override
    public Meal update(Long id, Meal meal) {
        return null;
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Override
    public Meal create(Meal meal) {
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

    public List<Meal> retrieveByDateRange(Date startDate, Date endDate) {
        List<Meal> byDateBetween = repository.findByDateBetween(startDate, endDate);
        return byDateBetween;
    }

    public Meal retrieveByDate(Date date) {
        return repository.findByDate(date);
    }
}
