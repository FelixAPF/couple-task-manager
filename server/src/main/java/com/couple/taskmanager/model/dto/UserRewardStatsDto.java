package com.couple.taskmanager.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class UserRewardStatsDto {
    private HouseholdMemberDto householdMember;
    private int rewardPoints = 0;
    private String color = "#000000";

}
