package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.ToDoItem;
import com.couple.taskmanager.model.WayToCare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ToDoItemRepository extends JpaRepository<ToDoItem, Long> {
    @Query("SELECT w FROM ToDoItem w WHERE w.household.id = :householdId")
    List<ToDoItem> findAllByHouseholdId(Long householdId);
}
