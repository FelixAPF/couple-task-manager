package com.couple.taskmanager.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

@Data
@Entity
@Table(name = "user_refresh_tokens", uniqueConstraints = {
        @UniqueConstraint(columnNames = "user_id")
})
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private CTMUser user;

    @Column(nullable = false)
    private String token;

    @Column(nullable = false)
    private Instant expiryDate;
}