package com.couple.taskmanager.model.blindbox;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "collection_rarity_rate_overrides", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"collection_id", "rarity_id"})
})
@Data
public class CollectionRarityRateOverride {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collection_id", nullable = false)
    @JsonBackReference("collection-rate-overrides")
    private BlindBoxCollection collection;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rarity_id", nullable = false)
    private BlindBoxRarity rarity;

    @Column(nullable = false)
    private Double customDropRate;
}