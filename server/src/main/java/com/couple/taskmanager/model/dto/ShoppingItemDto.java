package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.enums.Store;
import com.couple.taskmanager.model.ShoppingItem;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShoppingItemDto {
    private Long id;
    private String name;
    private Boolean bought;
    private Store store;

    public ShoppingItemDto(ShoppingItem shoppingItem){
        this.id = shoppingItem.getId();
        this.name = shoppingItem.getName();
        this.bought = shoppingItem.getBought();
        this.store = shoppingItem.getStore();
    }
}
