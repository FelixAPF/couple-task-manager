package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.ShoppingItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShoppingItemRepository extends JpaRepository<ShoppingItem, Long> {

    Optional<ShoppingItem> findByIdAndHouseholdId(Long id, Long householdId);
    List<ShoppingItem> findAllByHouseholdId(Long householdId);
    boolean existsByIdAndHouseholdId(Long id, Long householdId);
    @Modifying
    @Transactional
    @Query(value = "UPDATE ShoppingItem s SET s.bought = true WHERE s.id = :id AND s.household.id = :householdId")
    void markAsBought(@Param("id")  Long id, @Param("householdId") Long householdId);

    @Query("SELECT DISTINCT s.name FROM ShoppingItem s")
    List<String> findDistinctByName();

    @Query("SELECT s FROM ShoppingItem s WHERE s.bought = false AND s.household.id = :householdId")
    List<ShoppingItem> findAllByBoughtFalseAndHouseholdId(Long householdId);
}
