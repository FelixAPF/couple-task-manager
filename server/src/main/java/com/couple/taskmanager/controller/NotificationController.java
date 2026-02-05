package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Notification;
import com.couple.taskmanager.repository.NotificationRepository;
import com.couple.taskmanager.service.CTMUserService;
import com.couple.taskmanager.service.FirebaseMessagingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications") // Changed from /api/notifications to match previous fixes
public class NotificationController {

    @Autowired
    private FirebaseMessagingService firebaseService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private CTMUserService userService;

    // --- Your Existing Method ---
    @PostMapping("/token")
    public ResponseEntity<Void> registerToken(@AuthenticationPrincipal CTMUser user, @RequestBody String token) {
        firebaseService.saveToken(user, token);
        return ResponseEntity.ok().build();
    }

    // --- NEW METHODS ---

    @GetMapping
    public ResponseEntity<List<Notification>> getUserNotifications() {
        return ResponseEntity.ok(notificationRepository.findByUserOrderByCreatedDateDesc(userService.getCurrentUser()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount() {
        return ResponseEntity.ok(notificationRepository.countByUserAndIsReadFalse(userService.getCurrentUser()));
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllRead() {
        CTMUser user = userService.getCurrentUser();
        List<Notification> unread = notificationRepository.findByUserAndIsReadFalse(user);
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
        return ResponseEntity.ok().build();
    }
}