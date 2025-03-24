package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.enums.Room;
import com.couple.taskmanager.model.TaskAssignment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor @AllArgsConstructor
public class TaskAssignmentDto {
    private Long id;
    private String taskTitle;
    private String taskDescription;
    private Assignee assignee;
    private Date creationDate;
    private Date dueDate;
    private Room room;
    private Boolean completed;
    private Long taskPeriodId;

    public TaskAssignmentDto(TaskAssignment taskAssignment) {
        this.id = taskAssignment.getId();
        this.taskTitle = taskAssignment.getTask().getTitle();
        this.taskDescription = taskAssignment.getTask().getDescription();
        this.assignee = taskAssignment.getAssignee();
        this.creationDate = taskAssignment.getCreationDate();
        this.dueDate = taskAssignment.getDueDate();
        this.completed = taskAssignment.getCompleted();
        this.room = taskAssignment.getTask().getRoom();
        this.taskPeriodId = taskAssignment.getTaskPeriod().getId();
    }
}