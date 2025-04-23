package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.CTMUser;
import lombok.Data;

@Data
public class QuickCompleteRqstV1 {
    private Long taskId;
    private HouseholdMemberDto assignee;
}
