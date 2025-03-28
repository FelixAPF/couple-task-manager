package com.couple.taskmanager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NonNull;

import java.util.List;

@Data
@Entity
public class Recipe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NonNull
    private String name;

    private String description;

    private String category; //TODO: CHANGER POUR ENUM

    private String imageUrl;

    @OneToMany
    private List<Ingredient> ingredients;

}
