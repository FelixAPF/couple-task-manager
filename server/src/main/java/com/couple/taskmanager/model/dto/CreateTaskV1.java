package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Task;
import lombok.Data;

@Data
public class CreateTaskV1 {
    private Task task;
    private Long assigneeUserId;
    private Long procedureId;
}
