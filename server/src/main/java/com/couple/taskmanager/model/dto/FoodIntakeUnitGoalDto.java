package com.couple.taskmanager.model.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class FoodIntakeUnitGoalDto {
    private Long id;
    private Long assigneeId;
    private LocalDate date; // the date this resolved goal applies to (set by the server on read)
    private Double proteinTarget;
    private Double vegetableTarget;
    private Double carbohydrateTarget;
    private Double fatTarget;
}