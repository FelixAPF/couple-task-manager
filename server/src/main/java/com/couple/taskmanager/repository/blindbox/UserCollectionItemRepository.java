package com.couple.taskmanager.repository.blindbox;

import com.couple.taskmanager.model.blindbox.UserCollectionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserCollectionItemRepository extends JpaRepository<UserCollectionItem, Long> {
    List<UserCollectionItem> findByUserId(Long userId);

    @Query("SELECT uci FROM UserCollectionItem uci WHERE uci.user.id = :userId AND uci.item.collection.id = :collectionId")
    List<UserCollectionItem> findByUserIdAndItemCollectionId(@Param("userId") Long userId, @Param("collectionId") Long collectionId);

    Optional<UserCollectionItem> findByUserIdAndItemId(Long userId, Long itemId);
}