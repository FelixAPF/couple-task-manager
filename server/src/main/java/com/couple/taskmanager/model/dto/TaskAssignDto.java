package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.TaskAssign;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskAssignDto {
    private TaskDto task;
    private HouseholdMemberDto householdMemberDto;

    public TaskAssignDto(TaskAssign taskAssign){
        this.task = new TaskDto(taskAssign.getTask());
        this.householdMemberDto = new HouseholdMemberDto(taskAssign.getAssignee());
    }
}
