package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.WayToCare;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WayToCareDto {
    private Long id;
    private String title;
    private String description;
    private double cost;
    private String location;
    private HouseholdMemberDto assignee;

    public WayToCareDto(WayToCare wayToCare) {
        this.id = wayToCare.getId();
        this.title = wayToCare.getTitle();
        this.description = wayToCare.getDescription();
        this.cost = wayToCare.getCost();
        this.location = wayToCare.getLocation();
        this.assignee = new HouseholdMemberDto(wayToCare.getAssignee());
    }
}
