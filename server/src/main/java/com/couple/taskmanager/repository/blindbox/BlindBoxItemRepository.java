package com.couple.taskmanager.repository.blindbox;

import com.couple.taskmanager.model.blindbox.BlindBoxItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlindBoxItemRepository extends JpaRepository<BlindBoxItem, Long> {
    List<BlindBoxItem> findByCollectionId(Long collectionId);
    List<BlindBoxItem> findByCollectionIdOrderByItemNumberAsc(Long collectionId);
}