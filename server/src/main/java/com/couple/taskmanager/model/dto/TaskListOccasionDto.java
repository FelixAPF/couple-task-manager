package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.TaskListOccasion;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
public class TaskListOccasionDto {
    private Long id;
    private String name;
    private HouseholdDto householdDto;
    private List<TaskAssignDto> taskAssignments;

    public TaskListOccasionDto(TaskListOccasion byId) {
        this.name = byId.getName();
        this.taskAssignments = byId.getTaskAssignments().stream().map(TaskAssignDto::new).toList();
        this.householdDto = new HouseholdDto(byId.getHousehold());
        this.id = byId.getId();
    }
}
