package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.enums.ToDoStatus;
import com.couple.taskmanager.model.ToDoItem;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ToDoItemDto {
    private Long id;
    private String title;
    private String description;
    private Double cost;
    private String location;
    private ToDoStatus status;
    private Double rating;

    public ToDoItemDto(ToDoItem toDoItem) {
        this.id = toDoItem.getId();
        this.title = toDoItem.getTitle();
        this.description = toDoItem.getDescription();
        this.cost = toDoItem.getCost();
        this.location = toDoItem.getLocation();
        this.status = toDoItem.getStatus();
        this.rating = toDoItem.getRating();
    }
}
