package com.couple.taskmanager.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
public class Trip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String destination;
    private LocalDate departureDate;
    private Boolean completed = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id") // The foreign key column in the 'trip' table
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonBackReference("user-trip")
    private CTMUser user;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "trip")
    @JsonManagedReference("trip-item")
    private List<TripItem> items = new ArrayList<>();

}