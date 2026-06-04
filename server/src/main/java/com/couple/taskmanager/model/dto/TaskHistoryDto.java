package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.TaskHistory;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
public class TaskHistoryDto {
    private Long id;
    private Long taskId;
    private String taskTitle;
    private Date completedDate;
    private HouseholdMemberDto completedBy;

    public TaskHistoryDto(TaskHistory history) {
        this.id = history.getId();
        this.taskId = history.getTask().getId();
        this.completedDate = history.getCompletedDate();
        this.taskTitle = history.getTask().getTitle();

        if (history.getCompletedBy() != null) {
            this.completedBy = new HouseholdMemberDto(
                    history.getCompletedBy().getId(),
                    history.getCompletedBy().getName(),
                    history.getCompletedBy().getEmail(),
                    history.getCompletedBy().getImageUrl(),
                    history.getCompletedBy().getBirthDay(),
                    null,
                    history.getCompletedBy().getRewardColor(),
                    history.getCompletedBy().getRewardPoints()
            );
        }
    }
}