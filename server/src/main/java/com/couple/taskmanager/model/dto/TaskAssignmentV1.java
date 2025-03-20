package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.config.AssigneeDeserializer;
import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskPeriod;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

import java.util.Date;

@Data
@NoArgsConstructor
public class TaskAssignmentV1 {
    private Long id;
    private Task task;
    private TaskPeriod taskPeriod;
    private long assignee;
    private Date creationDate;
    private Date dueDate;

}
