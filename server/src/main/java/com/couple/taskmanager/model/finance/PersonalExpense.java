package com.couple.taskmanager.model.finance;

import com.couple.taskmanager.model.CTMUser;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "personal_expenses")
public class PersonalExpense {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private CTMUser user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String frequency;

    private String targetBankAccountId;

    private String targetSubAccountId;

    @Column(nullable = false, columnDefinition ="BOOLEAN DEFAULT false")
    private Boolean isGrocery = false;

    @Column(name = "color")
    private String color = "#3b82f6";

    @Column(name = "order_index")
    private Integer orderIndex = 0;
}