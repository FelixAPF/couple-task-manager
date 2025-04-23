package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.enums.RecipeType;
import com.couple.taskmanager.model.Ingredient;
import com.couple.taskmanager.model.Recipe;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecipeDto {
    private Long id;
    private String name;
    private String description;
    private RecipeType category;
    private String imageUrl;
    private List<IngredientDto> ingredients;

    public RecipeDto(Recipe recipe){
        this.id = recipe.getId();
        this.name = recipe.getName();
        this.description = recipe.getDescription();
        this.category = recipe.getCategory();
        this.imageUrl = recipe.getImageUrl();
        this.ingredients = recipe.getIngredients().stream().map(IngredientDto::new).toList();
    }
}
