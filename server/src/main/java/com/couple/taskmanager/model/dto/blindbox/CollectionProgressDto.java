package com.couple.taskmanager.model.dto.blindbox;

import com.couple.taskmanager.model.blindbox.BlindBoxCollection;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CollectionProgressDto {
    private Long id;
    private String name;
    private String description;
    private String bannerUrl;
    private long ownedItemsCount;
    private long totalItemsCount;

    public CollectionProgressDto(BlindBoxCollection collection, long ownedItemsCount, long totalItemsCount) {
        this.id = collection.getId();
        this.name = collection.getName();
        this.description = collection.getDescription();
        this.bannerUrl = collection.getBannerUrl();
        this.ownedItemsCount = ownedItemsCount;
        this.totalItemsCount = totalItemsCount;
    }
}