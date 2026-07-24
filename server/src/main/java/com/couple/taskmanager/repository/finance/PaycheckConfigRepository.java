package com.couple.taskmanager.repository.finance;

import com.couple.taskmanager.model.finance.PaycheckConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaycheckConfigRepository extends JpaRepository<PaycheckConfig, String> {
    Optional<PaycheckConfig> findByUserId(Long userId);
}