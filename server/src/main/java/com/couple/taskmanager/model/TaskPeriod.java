package com.couple.taskmanager.model;

import com.couple.taskmanager.enums.Assignee;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TaskPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "taskPeriod", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonManagedReference("taskPeriod-taskAssignments")
    private List<TaskAssignment> taskAssignments;

    private Date startDate;
    private Date endDate;
    private Boolean completed;
    private Date completedDate;

    @ManyToOne
    @JsonBackReference("household-task-periods")
    private Household household;


}
