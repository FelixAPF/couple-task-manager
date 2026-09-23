package com.couple.taskmanager.model.blindbox;

import com.couple.taskmanager.model.CTMUser;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.Date;

@Entity
@Table(name = "user_collection_items", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "item_id"})
})
@Data
public class UserCollectionItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private CTMUser user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    private BlindBoxItem item;

    @Column(nullable = false)
    private Integer count = 1; // Tracks duplicates

    @Column(nullable = false)
    private Date firstObtainedDate = new Date();

    private Date lastObtainedDate = new Date();
}