package com.couple.taskmanager.repository.blindbox;

import com.couple.taskmanager.model.blindbox.BlindBoxRarity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlindBoxRarityRepository extends JpaRepository<BlindBoxRarity, Long> {
    List<BlindBoxRarity> findAllByOrderByDisplayOrderAsc();
}