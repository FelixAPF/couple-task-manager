package com.couple.taskmanager.model;

import com.couple.taskmanager.enums.RecipeType;
import com.fasterxml.jackson.annotation.JsonBackReference;
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

    @Column(name = "description", length = 5000)
    private String description;

    @Column(columnDefinition = "SMALLINT USING category::smallint")
    private RecipeType category;

    private String imageUrl;

    @OneToMany(cascade = CascadeType.ALL)
    private List<Ingredient> ingredients;

    @ManyToOne
    @JsonBackReference("household-recipes")
    private Household household;

}
