package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // Get all notifications for a user, newest first
    List<Notification> findByUserOrderByCreatedDateDesc(CTMUser user);

    // Count unread for the badge
    long countByUserAndIsReadFalse(CTMUser user);

    // Find all unread to mark them as read
    List<Notification> findByUserAndIsReadFalse(CTMUser user);
}