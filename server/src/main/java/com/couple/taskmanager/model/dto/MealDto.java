package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.Meal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MealDto {
    private Long id;
    private String location;
    private Date date;
    private RecipeDto recipe;

    public MealDto(Meal meal){
        this.id = meal.getId();
        this.location = meal.getLocation();
        this.date = meal.getDate();
        this.recipe = new RecipeDto(meal.getRecipe());
    }
}
