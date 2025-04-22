package com.couple.taskmanager.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor @NoArgsConstructor
public class HouseholdMemberDto {
    private String name;
    private String email;
    private String imageUrl;
}
