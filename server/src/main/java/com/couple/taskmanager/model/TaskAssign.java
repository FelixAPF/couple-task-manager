package com.couple.taskmanager.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter
@Setter
@Entity
public class TaskAssign {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JsonBackReference("task-task-assign")
    private Task task;

    @ManyToOne
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonBackReference("user-task-assign")
    private CTMUser assignee;

    @ManyToOne
    @JsonBackReference("task-list-occasion-task-assign")
    private TaskListOccasion taskListOccasion;

}
