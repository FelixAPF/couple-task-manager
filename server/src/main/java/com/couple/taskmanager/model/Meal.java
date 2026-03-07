package com.couple.taskmanager.model;

import com.couple.taskmanager.enums.RecipeType;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NonNull;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.Date;
import java.util.List;

@Data
@Entity
public class Meal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;

    @Column(columnDefinition = "boolean default false")
    private Boolean isThawingNeeded = false;

    private Date date;
    private String location;

    @ManyToOne
    @JsonBackReference("household-meals")
    private Household household;

    @ManyToOne
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonBackReference("user-meal-assignments")
    private CTMUser assignedUser;
}
