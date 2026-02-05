package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.DeviceToken;
import com.couple.taskmanager.model.Notification;
import com.couple.taskmanager.repository.DeviceTokenRepository;
import com.couple.taskmanager.repository.NotificationRepository;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FirebaseMessagingService {

    @Autowired
    private DeviceTokenRepository tokenRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @PostConstruct
    public void initialize() {
        try {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(new ClassPathResource("firebase-service-account.json").getInputStream()))
                    .build();
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // --- OLD METHOD (Kept for backward compatibility, defaults to GENERIC) ---
    public void sendNotificationToUser(CTMUser user, String title, String body) {
        this.sendNotificationWithNavigation(user, title, body, "GENERIC", null);
    }

    public void sendNotificationToUsers(List<CTMUser> users, String title, String body) {
        if (users == null) return;
        for (CTMUser user : users) {
            // Reusing the single method ensures each user gets a DB record and a Push
            this.sendNotificationToUser(user, title, body);
        }
    }

    // --- NEW METHOD (Saves to DB + Push) ---
    public void sendNotificationWithNavigation(CTMUser user, String title, String body, String type, Long referenceId) {
        // 1. Persist Notification to Database
        Notification dbNotification = new Notification();
        dbNotification.setUser(user);
        dbNotification.setTitle(title);
        dbNotification.setMessage(body);
        dbNotification.setType(type);
        dbNotification.setReferenceId(referenceId);
        dbNotification.setCreatedDate(new Date());
        dbNotification.setRead(false);
        notificationRepository.save(dbNotification);

        // 2. Send Firebase Push Notification
        List<String> tokens = tokenRepository.findAllByUser(user).stream()
                .map(DeviceToken::getToken)
                .collect(Collectors.toList());

        if (tokens.isEmpty()) return;

        MulticastMessage message = MulticastMessage.builder()
                .setNotification(com.google.firebase.messaging.Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build())
                // We add data payload so the phone can also handle deep linking if needed
                .putData("type", type)
                .putData("referenceId", referenceId != null ? referenceId.toString() : "")
                .addAllTokens(tokens)
                .build();

        try {
            FirebaseMessaging.getInstance().sendEachForMulticast(message);
        } catch (FirebaseMessagingException e) {
            e.printStackTrace();
        }
    }

    public void saveToken(CTMUser user, String token) {
        String cleanToken = token.replace("\"", "");
        if (tokenRepository.findByToken(cleanToken).isEmpty()) {
            DeviceToken deviceToken = new DeviceToken();
            deviceToken.setUser(user);
            deviceToken.setToken(cleanToken);
            tokenRepository.save(deviceToken);
        }
    }
}