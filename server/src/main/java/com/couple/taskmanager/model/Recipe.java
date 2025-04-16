package com.couple.taskmanager.model;

import com.couple.taskmanager.enums.RecipeType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

import java.util.List;

@Data
@Entity
@AllArgsConstructor @NoArgsConstructor
public class Recipe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NonNull
    private String name;

    private String description;

    private RecipeType category; //TODO: CHANGER POUR ENUM

    private String imageUrl;

    @OneToMany(cascade = CascadeType.ALL)
    private List<Ingredient> ingredients;

}
