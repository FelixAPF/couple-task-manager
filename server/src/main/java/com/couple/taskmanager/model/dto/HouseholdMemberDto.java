package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.CTMUser;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor @NoArgsConstructor
public class HouseholdMemberDto {
    private Long id;
    private String name;
    private String email;
    private String imageUrl;
    private Date birthDay;

    public HouseholdMemberDto(CTMUser user){
        this.id = user.getId();
        this.name = user.getName();
        this.birthDay = user.getBirthDay();
        this.email = user.getEmail();
        this.imageUrl = user.getImageUrl();
    }
}
