package com.couple.taskmanager.model;

import com.couple.taskmanager.enums.FoodIntakeMealType;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
@Table(name = "food_intake_units")
public class FoodIntakeUnit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    private Household household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id", nullable = false)
    private CTMUser assignee;

    @Column(nullable = false)
    private LocalDate date;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FoodIntakeMealType mealType;

    private Double proteinPortion;
    private Double vegetablePortion;
    private Double carbohydratePortion;
    private Double fatPortion;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;
}