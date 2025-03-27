package com.couple.taskmanager.model;

import com.couple.taskmanager.config.AssigneeDeserializer;
import com.couple.taskmanager.enums.Assignee;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.Date;

@Entity
@Data
@NoArgsConstructor
public class TaskAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(cascade = CascadeType.ALL)
    @NonNull
    private Task task;

    @ManyToOne(fetch = FetchType.EAGER)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonBackReference
    private TaskPeriod taskPeriod;;

    @NonNull
    private Assignee assignee;

    @NonNull
    private Date creationDate;

    @NonNull
    private Date dueDate;

    @NonNull
    private Boolean completed = false;

    private Date completedDate;

    public TaskAssignment(@NonNull Task task, @NonNull TaskPeriod taskPeriod, @NonNull Assignee assignee, @NonNull Date creationDate, @NonNull Date dueDate) {
        this.task = task;
        this.taskPeriod = taskPeriod;
        this.assignee = assignee;
        this.creationDate = creationDate;
        this.dueDate = dueDate;
    }
}
