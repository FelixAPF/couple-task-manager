package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.enums.UserRole;
import com.couple.taskmanager.model.CTMUser;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;

import java.util.Date;
import java.util.List;

@Data
@AllArgsConstructor @NoArgsConstructor
public class HouseholdMemberDto {
    private Long id;
    private String name;
    private String email;
    private String imageUrl;
    private Date birthDay;
    private List<String> roles;

    public HouseholdMemberDto(CTMUser user){
        this.id = user.getId();
        this.name = user.getName();
        this.birthDay = user.getBirthDay();
        this.email = user.getEmail();
        this.imageUrl = user.getImageUrl();
        this.roles = user.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
    }
}
