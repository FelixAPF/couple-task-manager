package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.utils.StreamUtils;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HouseholdDto {
    private String name;
    private String householdJoinKey;
    private List<HouseholdMemberDto> members;

    private Boolean enableWaysToCare;
    private List<WayToCareDto> waysToCare;

    private Boolean enableToDoList;
    private List<ToDoItemDto> toDoItems;

    private Boolean enableWishList;
    private List<ItemDto> wishList;

    private Boolean enableTravelChecklist;
    private Boolean enableFoodIntakeTracking;

    private Boolean enableMeal = true;
    private Boolean enableTasks = true;
    private Boolean enableShoppingList = true;


    private HouseholdMemberDto currentUser;

    public HouseholdDto(Household household) {
        this.name = household.getName();
        this.householdJoinKey = household.getHouseholdJoinKey();
        this.members = StreamUtils.mapToList(household.getUsers(), HouseholdMemberDto::new);
        this.enableWaysToCare = household.getEnableWaysToCare();
        this.waysToCare = StreamUtils.mapToList(household.getWaysToCare(), WayToCareDto::new);
        this.enableToDoList = household.getEnableToDoList();
        this.toDoItems = StreamUtils.mapToList(household.getToDoItems(), ToDoItemDto::new);
        this.enableWishList = household.getEnableWishList();
        this.wishList = StreamUtils.mapToList(household.getItems(), ItemDto::new);
        this.enableTravelChecklist = household.getEnableTravelChecklist();
        this.enableFoodIntakeTracking = household.getEnableFoodIntakeTracking();
        this.enableMeal = household.getEnableMeal();
        this.enableTasks = household.getEnableTasks();
        this.enableShoppingList = household.getEnableShoppingList();
    }
}
