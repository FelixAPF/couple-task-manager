package com.couple.taskmanager.model.dto;

import lombok.Data;

@Data
public class UpdateHouseholdSettingsDto {
    private String name;
    private Boolean enableWaysToCare;
    private Boolean enableToDoList;
    private Boolean enableWishList;
    private Boolean enableTravelChecklist;
    private Boolean enableFoodIntakeTracking;
    private Boolean enableMeal;
    private Boolean enableTasks;
    private Boolean enableShoppingList;


}
