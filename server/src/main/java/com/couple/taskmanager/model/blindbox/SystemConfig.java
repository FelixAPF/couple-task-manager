package com.couple.taskmanager.model.blindbox;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "system_configs")
@Data
public class SystemConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String configKey;

    private String configValue;
}