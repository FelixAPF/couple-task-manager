package com.couple.taskmanager.model;

import com.couple.taskmanager.enums.Assignee;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskList {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @OneToMany(cascade = CascadeType.ALL)
    @NonNull
    private List<Task> tasks = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @NonNull
    private Assignee assignee;

    @ManyToOne
    @JsonBackReference("household-task-lists")
    private Household household;

    public TaskList(@NonNull List<Task> tasks, @NonNull Assignee assignee) {
        this.tasks = tasks;
        this.assignee = assignee;
    }

}
