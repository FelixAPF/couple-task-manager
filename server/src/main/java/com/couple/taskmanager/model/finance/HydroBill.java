package com.couple.taskmanager.model.finance;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "hydro_bills")
@Data
public class HydroBill {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String householdId;

    @Column(nullable = false)
    private LocalDateTime periodStart;

    @Column(nullable = false)
    private LocalDateTime periodEnd;

    @Column(nullable = false)
    private Double amount;

    private Double kwhConsumed;
}