package com.couple.taskmanager.model.blindbox;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "blind_box_keys")
@Data
public class BlindBoxKey {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // e.g. "Clé Naruto Shippuden"

    private String description;

    private String icon = "pi pi-key";

    private String color = "#f97316";

    @ManyToOne(fetch = FetchType.EAGER, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinColumn(name = "blind_box_id", nullable = false)
    private BlindBox blindBox;
}