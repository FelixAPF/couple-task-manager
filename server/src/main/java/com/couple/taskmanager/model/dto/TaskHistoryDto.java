package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.enums.Room;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskAssignment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor @AllArgsConstructor
public class TaskHistoryDto {
    private Task task;
    private List<TaskAssignmentDto> taskAssignments;
}