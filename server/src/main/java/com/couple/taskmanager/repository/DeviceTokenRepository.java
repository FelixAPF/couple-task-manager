package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {
    List<DeviceToken> findAllByUser(CTMUser user);
    List<DeviceToken> findAllByUserIn(List<CTMUser> users);
    Optional<DeviceToken> findByToken(String token);

    @Modifying
    @Transactional
    void deleteByToken(String deadToken);
}