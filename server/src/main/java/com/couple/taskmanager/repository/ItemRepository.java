package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.Item;
import com.couple.taskmanager.model.WayToCare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    @Query("SELECT i FROM Item i WHERE i.household.id = :householdId")
    List<Item> findAllByHouseholdId(Long householdId);
}
