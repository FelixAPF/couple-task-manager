package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.DeviceToken;
import com.couple.taskmanager.repository.DeviceTokenRepository;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FirebaseMessagingService {

    @Autowired
    private DeviceTokenRepository tokenRepository;

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

    public void sendNotificationToUser(CTMUser user, String title, String body) {
        List<String> tokens = tokenRepository.findAllByUser(user).stream()
                .map(DeviceToken::getToken)
                .collect(Collectors.toList());

        if (tokens.isEmpty()) return;

        MulticastMessage message = MulticastMessage.builder()
                .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                .addAllTokens(tokens)
                .build();

        try {
            // CORRECTION ICI : Utilisez sendEachForMulticast au lieu de sendMulticast
            FirebaseMessaging.getInstance().sendEachForMulticast(message);
        } catch (FirebaseMessagingException e) {
            e.printStackTrace();
        }
    }

    public void sendNotificationToUsers(List<CTMUser> users, String title, String body) {
        List<String> tokens = tokenRepository.findAllByUserIn(users).stream()
                .map(DeviceToken::getToken)
                .collect(Collectors.toList());

        if (tokens.isEmpty()) return;

        MulticastMessage message = MulticastMessage.builder()
                .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                .addAllTokens(tokens)
                .build();

        try {
            // CORRECTION ICI AUSSI
            FirebaseMessaging.getInstance().sendEachForMulticast(message);
        } catch (FirebaseMessagingException e) {
            e.printStackTrace();
        }
    }

    public void saveToken(CTMUser user, String token) {
        // Nettoyage basique si jamais des guillemets traînent
        String cleanToken = token.replace("\"", "");
        if (tokenRepository.findByToken(cleanToken).isEmpty()) {
            DeviceToken deviceToken = new DeviceToken();
            deviceToken.setUser(user);
            deviceToken.setToken(cleanToken);
            tokenRepository.save(deviceToken);
        }
    }
}