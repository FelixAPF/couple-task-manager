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
    private Task task;
    private Date completedDate;
}
