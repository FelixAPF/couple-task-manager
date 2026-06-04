package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.enums.Room;
import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Task;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskDto {
    private Long id;
    private String title;
    private String description;
    private Frequency frequency;
    private Room room;

    // --- NEW FIELDS ---
    private Date startDate;
    private Date dueDate;
    private HouseholdMemberDto assignee;

    public TaskDto(Task task) {
        this.id = task.getId();
        this.title = task.getTitle();
        this.description = task.getDescription();
        this.frequency = task.getFrequency();
        this.room = task.getRoom();
        this.startDate = task.getStartDate();
        this.dueDate = task.getDueDate();

        CTMUser user = task.getAssignee();
        if (user != null) {
            this.assignee = new HouseholdMemberDto(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getImageUrl(),
                    user.getBirthDay(),
                    user.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList(),
                    user.getRewardColor(),
                    user.getRewardPoints()
            );
        }
    }
}