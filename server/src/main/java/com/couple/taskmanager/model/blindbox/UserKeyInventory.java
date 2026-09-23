package com.couple.taskmanager.model.blindbox;

import com.couple.taskmanager.model.CTMUser;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "user_key_inventory", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "key_id"})
})
@Data
public class UserKeyInventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private CTMUser user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "key_id", nullable = false)
    private BlindBoxKey key;

    @Column(nullable = false)
    private Integer quantity = 0;
}