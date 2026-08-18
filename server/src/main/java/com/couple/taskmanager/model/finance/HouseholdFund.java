package com.couple.taskmanager.model.finance;

import com.couple.taskmanager.model.Household;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "household_fund")
public class HouseholdFund {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false, unique = true)
    @JsonIgnore
    private Household household;

    @Column(nullable = false)
    private Double balance = 0.0;
}