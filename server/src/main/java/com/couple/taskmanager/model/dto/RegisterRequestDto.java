package com.couple.taskmanager.model.dto;

import lombok.Data;

@Data
public class RegisterRequestDto {
    private String email;
    private String password;
    private boolean createNewHousehold;
    private String householdToken;
    private String newHouseholdName;
    private String name;

}
