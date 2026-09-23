package com.couple.taskmanager.repository.blindbox;

import com.couple.taskmanager.model.blindbox.BlindBoxKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlindBoxKeyRepository extends JpaRepository<BlindBoxKey, Long> {
    Optional<BlindBoxKey> findByBlindBoxId(Long blindBoxId);
}