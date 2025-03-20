package com.couple.taskmanager.model;

import com.couple.taskmanager.enums.Assignee;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor @AllArgsConstructor
public class TaskAssignmentDto {
    private Long periodId;

    private Long taskId;
    private Assignee assignee;
    private Date dueDate;
}
