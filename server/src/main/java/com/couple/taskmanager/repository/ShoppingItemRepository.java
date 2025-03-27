package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.ShoppingItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ShoppingItemRepository extends JpaRepository<ShoppingItem, Long> {
    @Modifying
    @Transactional
    @Query(value = "UPDATE ShoppingItem s SET s.bought = true WHERE s.id = :id")
    void markAsBought(@Param("id")  Long id);

    @Query("SELECT DISTINCT s.name FROM ShoppingItem s")
    List<String> findDistinctByName();

    List<ShoppingItem> findAllByBoughtFalse();
}
