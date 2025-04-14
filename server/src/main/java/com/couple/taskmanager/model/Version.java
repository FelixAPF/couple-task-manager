package com.couple.taskmanager.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Data
@Entity
public class Version {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String versionNumber;
}
