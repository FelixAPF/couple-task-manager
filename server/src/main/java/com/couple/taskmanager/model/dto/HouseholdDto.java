package com.couple.taskmanager.model.dto;

import lombok.Data;

import java.util.List;

@Data
public class HouseholdDto {
    private String name;
    private String householdJoinKey;
    private List<HouseholdMemberDto> members;
}
