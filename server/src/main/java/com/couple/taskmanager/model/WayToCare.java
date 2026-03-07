package com.couple.taskmanager.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Data
@Entity
public class WayToCare {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    private double cost;

    private String location;

    @ManyToOne
    @JoinColumn(name = "assignee_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonBackReference("user-ways-to-care")
    private CTMUser assignee;

    @ManyToOne
    @JoinColumn(name = "household_id")
    @JsonBackReference("household-way-to-care")
    private Household household;
}
