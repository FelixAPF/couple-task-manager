package com.couple.taskmanager.model;

import com.couple.taskmanager.enums.ItemType;
import com.couple.taskmanager.enums.Store;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ShoppingItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NonNull
    private String name;

    @NonNull
    private Boolean bought = false;

    private Store store;

    private ItemType type;

    private Double quantity;

    @ManyToOne
    @JsonBackReference("household-shopping-items")
    private Household household;


}
