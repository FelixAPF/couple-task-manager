package com.couple.taskmanager.model;

import com.couple.taskmanager.enums.Assignee;
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

    @OneToMany
    private List<TaskAssignment> taskAssignments;

    private Date startDate;
    private Date endDate;
}
