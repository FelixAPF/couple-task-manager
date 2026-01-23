package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.service.FirebaseMessagingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private FirebaseMessagingService firebaseService;

    @PostMapping("/token")
    public ResponseEntity<Void> registerToken(@AuthenticationPrincipal CTMUser user, @RequestBody String token) {
        firebaseService.saveToken(user, token);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/test")
    public ResponseEntity<?> sendTestNotification(@AuthenticationPrincipal CTMUser user) {
        // This sends a notification immediately to the user calling the API
        firebaseService.sendNotificationToUser(user, "Test Success!", "If you read this, FCM is working!");
        return ResponseEntity.ok().build();
    }
}