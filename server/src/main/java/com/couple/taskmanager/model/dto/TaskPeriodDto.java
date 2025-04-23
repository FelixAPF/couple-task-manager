package com.couple.taskmanager.model.dto;
import com.couple.taskmanager.model.TaskPeriod;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TaskPeriodDto {
    private Long id;
    private List<TaskAssignmentDto> taskAssignments;
    private Date startDate;
    private Date endDate;
    private Boolean completed;
    private Date completedDate;

    public TaskPeriodDto(TaskPeriod taskPeriod){
        this.id = taskPeriod.getId();
        this.taskAssignments = taskPeriod.getTaskAssignments().stream().map(TaskAssignmentDto::new).toList();
        this.startDate = taskPeriod.getStartDate();
        this.endDate = taskPeriod.getEndDate();
        this.completed = taskPeriod.getCompleted();
        this.completedDate = taskPeriod.getCompletedDate();
    }
}
