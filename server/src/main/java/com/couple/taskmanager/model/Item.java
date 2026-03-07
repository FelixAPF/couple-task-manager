package com.couple.taskmanager.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String description;
    private Double cost;
    private String link;
    private Boolean bought;

    @ManyToOne
    @JoinColumn(name = "assignee_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonBackReference("user-wish-list")
    private CTMUser assignee;

    @ManyToOne
    @JoinColumn(name = "household_id")
    @JsonBackReference("household-wish-list")
    private Household household;
}
