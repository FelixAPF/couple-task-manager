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

    private HouseholdMemberDto currentUser;

    public HouseholdDto(Household household) {
        this.name = household.getName();
        this.householdJoinKey = household.getHouseholdJoinKey();
        this.members = StreamUtils.mapToList(household.getUsers(), HouseholdMemberDto::new);
        this.enableWaysToCare = household.getEnableWaysToCare();
        this.waysToCare = StreamUtils.mapToList(household.getWaysToCare(), WayToCareDto::new);
        this.enableToDoList = household.getEnableToDoList();
        this.toDoItems = StreamUtils.mapToList(household.getToDoItems(), ToDoItemDto::new);
    }
}
