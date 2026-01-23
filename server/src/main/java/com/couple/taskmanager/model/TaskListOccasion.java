package com.couple.taskmanager.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TaskListOccasion {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "household_id") // Explicitly specify the column name
    @JsonBackReference("household-task-list-occasion")
    private Household household;

    @OneToMany(mappedBy = "taskListOccasion", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("task-list-occasion-task-assign")
    private List<TaskAssign> taskAssignments = new ArrayList<>();

    private String name;


}
