package com.couple.taskmanager.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopMealDto {
    private Long recipeId;
    private String recipeName;
    private String category;
    private String imageUrl;
    private long count;
    private Date lastEaten;
}