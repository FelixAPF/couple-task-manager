package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.Item;
import com.couple.taskmanager.model.Meal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ItemDto {
    private Long id;
    private String title;
    private String description;
    private Double cost;
    private String link;
    private Boolean bought;
    private HouseholdMemberDto householdMember;

    public ItemDto(Item item){
        this.id = item.getId();
        this.title = item.getTitle();
        this.description = item.getDescription();
        this.cost = item.getCost();
        this.link = item.getLink();
        this.bought = item.getBought();
        this.householdMember = new HouseholdMemberDto(item.getAssignee());
    }
}
