package com.couple.taskmanager.model.blindbox;

import com.couple.taskmanager.enums.CardEffectType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "blind_box_rarities")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlindBoxRarity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // e.g. "Commun", "Hors du Commun", "Rare", "Légendaire"

    @Column(nullable = false)
    private String borderColor; // Hex e.g. "#94a3b8", "#eab308", "#ec4899"

    @Column(nullable = false)
    private String badgeColor; // Badge background

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CardEffectType effectType; // STANDARD, FOIL, HOLOGRAPHIC, etc.

    @Column(nullable = false)
    private Double defaultDropRate; // e.g. 60.0, 25.0, 10.0, 4.0, 1.0

    @Column(nullable = false)
    private Integer displayOrder; // 1, 2, 3...
}