package com.couple.taskmanager.model.dto;

import lombok.Data;

import java.util.List;

@Data
public class CreateLetterDto {
    private Long receiverId;
    private String title;
    private String letterType;
    private boolean hasOptions;
    private String optionsTitle;
    private List<String> options;
    private String description;
}