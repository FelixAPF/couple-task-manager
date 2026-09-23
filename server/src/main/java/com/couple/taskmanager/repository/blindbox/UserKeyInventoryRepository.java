package com.couple.taskmanager.repository.blindbox;

import com.couple.taskmanager.model.blindbox.UserKeyInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserKeyInventoryRepository extends JpaRepository<UserKeyInventory, Long> {
    List<UserKeyInventory> findByUserId(Long userId);
    Optional<UserKeyInventory> findByUserIdAndKeyId(Long userId, Long keyId);
}