package com.couple.taskmanager.model.finance;

import com.couple.taskmanager.model.Household;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Data
@Entity
@Table(name = "grocery_fund")
public class GroceryFund {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false, unique = true)
    @JsonIgnore
    private Household household;

    @Column(nullable = false)
    private Double balance = 0.0;

    @Column(name = "cycle_anchor_date")
    private LocalDate cycleAnchorDate;

    @Column(name = "cycle_length_days", nullable = false, columnDefinition = "integer DEFAULT 14")
    private Integer cycleLengthDays = 14;
}