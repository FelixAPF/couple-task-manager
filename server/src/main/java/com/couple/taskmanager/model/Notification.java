package com.couple.taskmanager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;

@Entity
@Data
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String message;

    // Type determines where the user is redirected (e.g., "LETTER", "TASK")
    private String type;

    // The ID of the object (e.g., Letter ID, Task ID)
    private Long referenceId;

    private boolean isRead = false;
    private Date createdDate;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password", "taskAssignments", "taskAssigns", "assignedMeal", "taskLists", "waysToCare", "wishList", "trips", "travelTemplateItems", "household", "notifications"})
    private CTMUser user;
}