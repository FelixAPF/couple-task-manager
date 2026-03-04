package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.enums.FoodIntakeMealType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDate;

@Data
public class FoodIntakeUnitDto {
    private Long id;
    private LocalDate date;
    private Long assigneeId;
    private String description;
    private FoodIntakeMealType mealType;

    // Maps directly to the property name defined in your Angular interface
    @JsonProperty("porteinPortion")
    private Double proteinPortion;

    private Double vegetablePortion;
    private Double carbohydratePortion;
    private Double fatPortion;

    private String imageUrl;
}