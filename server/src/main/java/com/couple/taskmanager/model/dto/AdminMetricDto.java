package com.couple.taskmanager.model.dto;

public class AdminMetricDto {
    private String householdName;
    private long numberOfUsers;
    private long numberOfRecipes;

    public AdminMetricDto() {
    }

    public AdminMetricDto(String householdName, long numberOfUsers, long numberOfRecipes) {
        this.householdName = householdName;
        this.numberOfUsers = numberOfUsers;
        this.numberOfRecipes = numberOfRecipes;
    }

    public String getHouseholdName() {
        return householdName;
    }

    public void setHouseholdName(String householdName) {
        this.householdName = householdName;
    }

    public long getNumberOfUsers() {
        return numberOfUsers;
    }

    public void setNumberOfUsers(long numberOfUsers) {
        this.numberOfUsers = numberOfUsers;
    }

    public long getNumberOfRecipes() {
        return numberOfRecipes;
    }

    public void setNumberOfRecipes(long numberOfRecipes) {
        this.numberOfRecipes = numberOfRecipes;
    }
}