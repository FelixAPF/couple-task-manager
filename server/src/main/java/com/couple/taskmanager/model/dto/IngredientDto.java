package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.Ingredient;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IngredientDto {
    private Long id;
    private String name;
    private String unit;
    private float quantity;

    public IngredientDto(Ingredient ingredient){
        this.id = ingredient.getId();
        this.name = ingredient.getName();
        this.unit = ingredient.getUnit();
        this.quantity = ingredient.getQuantity();
    }
}
