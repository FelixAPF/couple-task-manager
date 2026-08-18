package com.couple.taskmanager.model.finance;

import com.couple.taskmanager.model.Household;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.boot.context.properties.bind.DefaultValue;

@Data
@Entity
@Table(name = "common_expenses")
public class CommonExpense {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @JsonIgnore
    private Household household;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String splitType;

    @Enumerated(EnumType.STRING)
    private TargetFund targetFund;
}