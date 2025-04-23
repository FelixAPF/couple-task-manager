package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.CTMUser;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor @NoArgsConstructor
public class HouseholdMemberDto {
    private Long id;
    private String name;
    private String email;
    private String imageUrl;

    public HouseholdMemberDto(CTMUser user){
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.imageUrl = user.getImageUrl();
    }
}
