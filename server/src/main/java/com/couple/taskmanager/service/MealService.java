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
    public Meal get(Long id, Long householdId, CTMUser user) {
        return repository.findById(id).orElseThrow(() -> new NoSuchElementException("No recipe with id " + id + " found"));
    }

    @Override
    public List<Meal> list(Long householdId, CTMUser user) {
        return repository.findAllByHouseholdId(householdId);
    }

    @Override
    public Meal update(Long id, Meal meal, CTMUser user) {
        if(meal.getHousehold() == null){
            meal.setHousehold(user.getHousehold());
        }
        if(repository.existsById(id)){
            return repository.save(meal);
        }
        throw new NoSuchElementException();
    }

    @Override
    public void delete(Long id, Long householdId, CTMUser user) {
        repository.deleteByMealIdAndHouseholdId(id, householdId);
    }

    @Override
    public Meal create(Meal meal, CTMUser user) {
        Recipe recipe = meal.getRecipe();
        Optional<Recipe> byId = recipeRepository.findById(recipe.getId());
        if(byId.isEmpty()){
            if(recipe.getHousehold() == null){
                recipe.setHousehold(user.getHousehold());
            }
            recipe = recipeRepository.save(recipe);
        }
        Meal newMeal = new Meal();
        newMeal.setHousehold(user.getHousehold());
        newMeal.setDate(meal.getDate());
        newMeal.setLocation(meal.getLocation());
        newMeal.setRecipe(byId.orElse(recipe));
        return repository.save(newMeal);
    }

    public List<Meal> retrieveByDateRange(long startDateMillis, long endDateMillis, CTMUser user) {
        Date startDate = new Date(startDateMillis);
        Date endDate = new Date(endDateMillis);
        return repository.findByDateBetweenAndHouseholdId(startDate, endDate, user.getHousehold().getId());
    }

    public Meal retrieveByDate(Date date, CTMUser user) {
        return repository.findByDateAndHouseholdId(date, user.getHousehold().getId());
    }
}
