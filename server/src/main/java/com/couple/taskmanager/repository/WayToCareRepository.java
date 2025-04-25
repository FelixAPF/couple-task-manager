package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.WayToCare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WayToCareRepository extends JpaRepository<WayToCare, Long> {
    @Query("SELECT w FROM WayToCare w WHERE w.household.id = :householdId")
    List<WayToCare> findAllByHouseholdId(Long householdId);
}
