package com.couple.taskmanager.model.dto.blindbox;

import com.couple.taskmanager.model.blindbox.BlindBoxItem;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UnboxResultDto {
    private BlindBoxItem item;

    @JsonProperty("isNew")
    private boolean isNew;

    private int count;
    private int remainingKeys;
}