package com.couple.taskmanager.model;

import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.enums.Room;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

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

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<TaskAssignment> taskAssignments;

    @NonNull
    private Room room;

    @ManyToOne
    @JsonBackReference("household-tasks")
    private Household household;

}
