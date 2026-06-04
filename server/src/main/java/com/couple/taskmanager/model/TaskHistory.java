package com.couple.taskmanager.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class TaskHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JsonBackReference("task-history")
    private Task task;

    @ManyToOne
    @JsonBackReference("user-task-history")
    private CTMUser completedBy;

    @NonNull
    private Date completedDate;

    public TaskHistory(Task task, CTMUser completedBy, @NonNull Date completedDate) {
        this.task = task;
        this.completedBy = completedBy;
        this.completedDate = completedDate;
    }
}