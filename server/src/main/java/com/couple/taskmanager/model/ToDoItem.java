package com.couple.taskmanager.model;

import com.couple.taskmanager.enums.ToDoStatus;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class ToDoItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    private Double cost;

    private String location;

    private ToDoStatus status;
    private Double rating;

    @ManyToOne
    @JsonBackReference("household-to-do-items")
    private Household household;
}
