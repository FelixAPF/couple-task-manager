package com.couple.taskmanager.model;

import com.couple.taskmanager.enums.Assignee;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskList {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @OneToMany
    @NonNull
    private List<Task> tasks;

    @Enumerated(EnumType.STRING)
    @NonNull
    private Assignee assignee;

    public TaskList(@NonNull List<Task> tasks, @NonNull Assignee assignee) {
        this.tasks = tasks;
        this.assignee = assignee;
    }
}
