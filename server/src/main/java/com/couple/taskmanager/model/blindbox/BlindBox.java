package com.couple.taskmanager.model.blindbox;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "blind_boxes")
@Data
public class BlindBox {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // e.g. "Boîte Shinobi Standard"

    @Column(columnDefinition = "TEXT")
    private String description;

    private String imageUrl;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "collection_id", nullable = false)
    @JsonIgnoreProperties({"items", "boxes", "rateOverrides"})
    private BlindBoxCollection collection;
}