package com.couple.taskmanager.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberTaskStatDto {
    private Long memberId;
    private String name;
    private String imageUrl;
    private long count;
    private int percentage;
}