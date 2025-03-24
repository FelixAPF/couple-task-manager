package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.enums.Assignee;
import lombok.Data;

@Data
public class TaskListRequestV1 {
    private Long taskListId;
    private Long taskId;
    private Assignee assignee;
}
