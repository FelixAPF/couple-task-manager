package com.couple.taskmanager.model.finance;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Household;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;

@Data
@Entity
@Table(name = "grocery_transactions")
public class GroceryTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @JsonIgnore
    private Household household;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private CTMUser user;

    @Transient
    private Long userId; // Mapped to frontend UI without exposing the full CTMUser object

    @Column(nullable = false)
    private String storeName;

    @Column
    private String description;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String transactionType; // ADD or SPEND

    @Column(nullable = false)
    private Date date;

    @PostLoad
    @PostPersist
    public void populateUserId() {
        if (user != null) {
            this.userId = user.getId();
        }
    }
}