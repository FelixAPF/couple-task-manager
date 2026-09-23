package com.couple.taskmanager.model.blindbox;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "blind_box_items")
@Data
public class BlindBoxItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collection_id", nullable = false)
    @JsonIgnoreProperties({"items", "boxes", "rateOverrides"})
    private BlindBoxCollection collection;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rarity_id", nullable = false)
    private BlindBoxRarity rarity;

    @Column(nullable = false)
    private Integer itemNumber; // e.g. 1 for #001

    @Column(nullable = false)
    private String name; // e.g. "Minato Namikaze"

    private String subtitle; // e.g. "L'Éclair Jaune de Konoha"

    @Column(columnDefinition = "TEXT")
    private String description; // Lore / quote

    @Column(columnDefinition = "TEXT")
    private String imageUrl;
}