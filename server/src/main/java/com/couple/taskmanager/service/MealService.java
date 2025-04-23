package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Meal;
import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.model.dto.MealDto;
import com.couple.taskmanager.repository.MealRepository;
import com.couple.taskmanager.repository.RecipeRepository;
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class MealService implements IGenericService<Meal, MealDto> {
    @Autowired
    MealRepository repository;
    @Autowired
    RecipeRepository recipeRepository;


    @Override
    public MealDto get(Long id, Long householdId, CTMUser user) {
        return repository.findById(id).map(MealDto::new).orElseThrow(() -> new NoSuchElementException("No recipe with id " + id + " found"));
    }

    @Override
    public List<MealDto> list(Long householdId, CTMUser user) {
        return StreamUtils.ofNullable(repository.findAllByHouseholdId(householdId)).map(MealDto::new).toList();
    }

    @Override
    public MealDto update(Long id, Meal meal, CTMUser user) {
        if(meal.getHousehold() == null){
            meal.setHousehold(user.getHousehold());
        }
        if(repository.existsById(id)){
            return new MealDto(repository.save(meal));
        }
        throw new NoSuchElementException();
    }

    @Override
    public void delete(Long id, Long householdId, CTMUser user) {
        Meal meal = repository.findById(id).orElseThrow(()-> new NoSuchElementException("Meal with id " + id + " not found."));
        if (!meal.getHousehold().getId().equals(householdId)) {
            throw new IllegalArgumentException("This meal is not part of your household");
        }
        repository.delete(meal);
    }

    @Override
    public MealDto create(Meal meal, CTMUser user) {
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
        return new MealDto(repository.save(newMeal));
    }

    public List<MealDto> retrieveByDateRange(long startDateMillis, long endDateMillis, CTMUser user) {
        Date startDate = new Date(startDateMillis);
        Date endDate = new Date(endDateMillis);
        return StreamUtils.mapToList(repository.findByDateBetweenAndHouseholdId(startDate, endDate, user.getHousehold().getId()), MealDto::new);
    }

    public MealDto retrieveByDate(Date date, CTMUser user) {
        return new MealDto(repository.findByDateAndHouseholdId(date, user.getHousehold().getId()));
    }
}
