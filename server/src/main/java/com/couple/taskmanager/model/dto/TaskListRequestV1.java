package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.CTMUser;
import lombok.Data;

@Data
public class TaskListRequestV1 {
    private Long taskListId;
    private Long taskId;
    private HouseholdMemberDto assignee;
}
