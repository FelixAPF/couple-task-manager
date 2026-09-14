package com.couple.taskmanager.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Getter
@Setter
public class TripItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String category;

    private int quantity = 1;

    private boolean included = true;

    private boolean packed = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    @JsonBackReference("trip-item")
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonIgnore
    private CTMUser user;

    // Lecture directe de la colonne en base (évite les proxies Hibernate)
    @Column(name = "user_id", insertable = false, updatable = false)
    private Long userId;

    @JsonProperty("userId")
    public Long getUserId() {
        if (this.userId != null) {
            return this.userId;
        }
        return user != null ? user.getId() : null;
    }
}