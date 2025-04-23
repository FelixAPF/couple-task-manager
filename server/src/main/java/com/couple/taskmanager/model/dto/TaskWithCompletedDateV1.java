package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.Task;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskWithCompletedDateV1 {
    private TaskDto task;
    private Date completedDate;
}
