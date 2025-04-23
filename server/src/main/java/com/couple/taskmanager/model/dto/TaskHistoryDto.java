package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.Task;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor @AllArgsConstructor
public class TaskHistoryDto {
    private TaskDto task;
    private List<TaskAssignmentDto> taskAssignments;
}