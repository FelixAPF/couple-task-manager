package com.couple.taskmanager.model.dto.blindbox;

import com.couple.taskmanager.model.blindbox.BlindBoxKey;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlindBoxKeyDto {
    private Long id;
    private String name;
    private String description;
    private String icon;
    private String color;
    private BlindBoxDto blindBox;

    public BlindBoxKeyDto(BlindBoxKey key) {
        if (key != null) {
            this.id = key.getId();
            this.name = key.getName();
            this.description = key.getDescription();
            this.icon = key.getIcon();
            this.color = key.getColor();
            if (key.getBlindBox() != null) {
                this.blindBox = new BlindBoxDto(key.getBlindBox());
            }
        }
    }
}