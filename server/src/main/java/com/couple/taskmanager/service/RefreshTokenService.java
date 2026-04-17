package com.couple.taskmanager.service;

import com.couple.taskmanager.exception.TokenRefreshException;
import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.RefreshToken;
import com.couple.taskmanager.model.dto.RefreshTokenRequest;
import com.couple.taskmanager.repository.CTMUserRepository;
import com.couple.taskmanager.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {
    @Value("${app.jwt.refresh-ms:15552000000}")
    private Long refreshTokenDurationMs;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private CTMUserRepository userRepository;

    @Transactional
    public RefreshToken createRefreshToken(String email) {
        CTMUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
        refreshToken.setToken(UUID.randomUUID().toString());

        return refreshTokenRepository.save(refreshToken);
    }

    // NEW: Rotate existing token to prevent DB bloat and push the expiry date further
    @Transactional
    public RefreshToken rotateRefreshToken(RefreshToken existingToken) {
        existingToken.setToken(UUID.randomUUID().toString());
        existingToken.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
        return refreshTokenRepository.save(existingToken); // This updates the existing row
    }

    public Optional<RefreshToken> findByToken(RefreshTokenRequest request) {
        return refreshTokenRepository.findByToken(request.getRefreshToken());
    }

    @Transactional
    @Scheduled(cron = "0 0 0 * * ?") // Runs every day at midnight
    public void purgeExpiredRefreshTokens() {
        refreshTokenRepository.deleteByExpiryDateBefore(Instant.now());
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new TokenRefreshException("Refresh token was expired. Please make a new signin request");
        }
        return token;
    }

    @Transactional
    public int deleteByUserId(Long userId) {
        return refreshTokenRepository.deleteByUser(userRepository.findById(userId).get());
    }
}