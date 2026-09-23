package com.couple.taskmanager.model.blindbox;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "blind_box_collections")
@Data
public class BlindBoxCollection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // e.g. "Naruto & Naruto Shippuden"

    @Column(columnDefinition = "TEXT")
    private String description;

    private String bannerUrl;

    @Column(nullable = false)
    private boolean active = true;

    private Integer displayOrder = 0;

    @OneToMany(mappedBy = "collection", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("collection")
    private List<BlindBoxItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "collection", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("collection")
    private List<BlindBox> boxes = new ArrayList<>();

    @OneToMany(mappedBy = "collection", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("collection")
    private List<CollectionRarityRateOverride> rateOverrides = new ArrayList<>();
}