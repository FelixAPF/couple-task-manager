package com.couple.taskmanager.model.dto.blindbox;

import com.couple.taskmanager.model.blindbox.BlindBox;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlindBoxDto {
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private Long collectionId;

    public BlindBoxDto(BlindBox box) {
        if (box != null) {
            this.id = box.getId();
            this.name = box.getName();
            this.description = box.getDescription();
            this.imageUrl = box.getImageUrl();
            if (box.getCollection() != null) {
                this.collectionId = box.getCollection().getId();
            }
        }
    }
}