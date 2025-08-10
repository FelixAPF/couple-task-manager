package com.couple.taskmanager.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Trip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String destination;
    private LocalDate departureDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id") // The foreign key column in the 'trip' table
    @JsonBackReference("user-trip")
    private CTMUser user;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "trip")
    @JsonManagedReference("trip-item")
    private List<TripItem> items = new ArrayList<>();

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public LocalDate getDepartureDate() {
        return departureDate;
    }

    public void setDepartureDate(LocalDate departureDate) {
        this.departureDate = departureDate;
    }

    public CTMUser getUser() {
        return user;
    }

    public void setUser(CTMUser user) {
        this.user = user;
    }

    public List<TripItem> getItems() {
        return items;
    }

    public void setItems(List<TripItem> items) {
        this.items = items;
    }
}