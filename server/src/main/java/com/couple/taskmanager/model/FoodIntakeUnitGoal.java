package com.couple.taskmanager.model;


import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Household;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@Table(
        name = "food_intake_unit_goals",
        uniqueConstraints = @UniqueConstraint(columnNames = {"assignee_id", "effective_date"})
)
public class FoodIntakeUnitGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "assignee_id", nullable = false)
    private CTMUser assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    private Household household;

    // The date this version of the goal STARTS applying from. Never in the past when created.
    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    private Double proteinTarget;
    private Double vegetableTarget;
    private Double carbohydrateTarget;
    private Double fatTarget;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { this.createdAt = LocalDateTime.now(); }
}