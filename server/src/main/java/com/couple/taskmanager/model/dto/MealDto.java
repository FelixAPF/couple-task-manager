package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Meal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MealDto {
    private Long id;
    private String location;
    private Date date;
    private RecipeDto recipe;
    private HouseholdMemberDto assignedUser;
    private Boolean isThawingNeeded;

    public MealDto(Meal meal){
        this.id = meal.getId();
        this.location = meal.getLocation();
        this.date = meal.getDate();
        this.recipe = new RecipeDto(meal.getRecipe());
        this.isThawingNeeded = meal.getIsThawingNeeded();

        CTMUser user = meal.getAssignedUser();
        if (user != null) {
            this.assignedUser = new HouseholdMemberDto(user.getId(), user.getName(), user.getEmail(), user.getImageUrl(), user.getBirthDay(), user.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList(), user.getRewardColor(), user.getRewardPoints());
        }
    }
}
