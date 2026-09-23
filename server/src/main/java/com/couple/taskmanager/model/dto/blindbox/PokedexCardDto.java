package com.couple.taskmanager.model.dto.blindbox;

import com.couple.taskmanager.model.blindbox.BlindBoxItem;
import com.couple.taskmanager.model.blindbox.BlindBoxRarity;
import com.couple.taskmanager.model.blindbox.UserCollectionItem;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PokedexCardDto {
    private Long id;
    private Integer itemNumber;
    private String name;
    private String subtitle;
    private String description;
    private String imageUrl;
    private BlindBoxRarity rarity;
    private boolean isUnlocked;
    private int count;
    private Date firstObtainedDate;

    public PokedexCardDto(BlindBoxItem item, UserCollectionItem userEntry) {
        this.id = item.getId();
        this.itemNumber = item.getItemNumber();
        this.name = item.getName();
        this.subtitle = item.getSubtitle();
        this.description = item.getDescription();
        this.imageUrl = item.getImageUrl();
        this.rarity = item.getRarity();
        this.isUnlocked = (userEntry != null && userEntry.getCount() > 0);
        this.count = userEntry != null ? userEntry.getCount() : 0;
        this.firstObtainedDate = userEntry != null ? userEntry.getFirstObtainedDate() : null;
    }
}