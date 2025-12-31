package com.couple.taskmanager.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

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
    @JsonBackReference("user-task-assign")
    private CTMUser assignee;

    @ManyToOne
    @JsonBackReference("task-list-occasion-task-assign")
    private TaskListOccasion taskListOccasion;

}
