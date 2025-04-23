package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.CTMUser;
import lombok.Data;

@Data
public class BasicTaskAssignmentRqstV1 {
    private Long taskId;
    private Long assigneeUserId;
}
