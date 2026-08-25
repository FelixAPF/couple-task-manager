package com.couple.taskmanager.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseholdStatsDto {
    private int year;
    private long totalTasksDone;
    private long totalActiveTasks;
    private double totalGrocerySpent;
    private double totalHouseholdFundSaved;
    private double householdFundBalance;
    private double totalHydroCost;
    private double totalHydroKwh;
    private long totalMealsCount;
    private List<TopMealDto> topMeals;
    private List<MemberTaskStatDto> memberTaskStats;
    private List<MemberChefStatDto> memberChefStats;
    private MemberChefStatDto topChef;
}