package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.enums.Store;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

@Data
public class ShoppingItemV1 {
    private Long id;
    private String name;
    private Boolean bought;
    private Store store;
}
