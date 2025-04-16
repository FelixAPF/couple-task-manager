package com.couple.taskmanager.model.dto;

import lombok.Data;

import java.util.Date;

@Data
public class MealDateRangeDto {
    private Date startDate;
    private Date endDate;
}
