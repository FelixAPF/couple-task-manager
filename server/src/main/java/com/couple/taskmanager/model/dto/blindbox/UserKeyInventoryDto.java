package com.couple.taskmanager.model.dto.blindbox;

import com.couple.taskmanager.model.blindbox.UserKeyInventory;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserKeyInventoryDto {
    private Long id;
    private BlindBoxKeyDto key;
    private Integer quantity;

    public UserKeyInventoryDto(UserKeyInventory inventory) {
        this.id = inventory.getId();
        if (inventory.getKey() != null) {
            this.key = new BlindBoxKeyDto(inventory.getKey());
        }
        this.quantity = inventory.getQuantity();
    }
}