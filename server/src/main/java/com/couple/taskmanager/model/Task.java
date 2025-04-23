package com.couple.taskmanager.model;

import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.enums.Room;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NonNull
    private String title;

    @NonNull
    private String description;

    @NonNull
    private Frequency frequency;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL)
    @JsonManagedReference("task-task-assignments")
    private List<TaskAssignment> taskAssignments;

    @ManyToMany(cascade = { CascadeType.PERSIST, CascadeType.MERGE })
    @JoinTable(
            name = "task_tasklist",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name= "tasklist_id")
    )
    private List<TaskList> taskLists = new ArrayList<>();

    @NonNull
    private Room room;

    @ManyToOne
    @JsonBackReference("household-tasks")
    private Household household;

}
