package com.couple.taskmanager.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
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

    @ManyToOne
    @JsonBackReference("task-task-assignments")
    private Task task;

    @ManyToOne(fetch = FetchType.EAGER)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonBackReference("taskPeriod-taskAssignments")
    private TaskPeriod taskPeriod;

    @NonNull
    @ManyToOne
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonBackReference("user-task-assignments")
    private CTMUser assignee;

    @NonNull
    private Date creationDate;

    @NonNull
    private Date startDate;

    @NonNull
    private Date dueDate;

    @NonNull
    private Boolean completed = false;

    private Date completedDate;

    @ManyToOne
    @JsonBackReference("household-task-assignments")
    private Household household;

    public TaskAssignment(@NonNull Task task, @NonNull TaskPeriod taskPeriod, @NonNull CTMUser assignee, @NonNull Date creationDate, @NonNull Date startDate, @NonNull Date dueDate) {
        this.task = task;
        this.taskPeriod = taskPeriod;
        this.assignee = assignee;
        this.creationDate = creationDate;
        this.startDate = startDate;
        this.dueDate = dueDate;
    }
}
