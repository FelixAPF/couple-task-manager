package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.enums.Frequency;
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
    private HouseholdMemberDto householdMemberDto;
    private Frequency frequency;
    private Date creationDate;
    private Date startDate;
    private Date dueDate;
    private Room room;
    private Boolean completed;
    private Date completedDate;
    private Long taskPeriodId;
    private Long taskId;

    public TaskAssignmentDto(TaskAssignment taskAssignment) {
        this.id = taskAssignment.getId();
        this.taskTitle = taskAssignment.getTask().getTitle();
        this.taskDescription = taskAssignment.getTask().getDescription();
        this.frequency = taskAssignment.getTask().getFrequency();
        this.startDate = taskAssignment.getStartDate();
        this.householdMemberDto = new HouseholdMemberDto(taskAssignment.getAssignee());
        this.creationDate = taskAssignment.getCreationDate();
        this.dueDate = taskAssignment.getDueDate();
        this.completed = taskAssignment.getCompleted();
        this.completedDate = taskAssignment.getCompletedDate();
        this.room = taskAssignment.getTask().getRoom();
        if(taskAssignment.getTaskPeriod() != null){
            this.taskPeriodId = taskAssignment.getTaskPeriod().getId();
        }
        this.taskId = taskAssignment.getTask().getId();
    }
}