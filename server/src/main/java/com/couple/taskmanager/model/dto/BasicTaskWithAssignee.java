package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.model.Task;
import lombok.Data;

@Data
public class BasicTaskWithAssignee {
    private Task task;
    private Assignee assignee;
}
