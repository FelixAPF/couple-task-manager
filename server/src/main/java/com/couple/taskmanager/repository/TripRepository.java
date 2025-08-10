package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByUserIdOrderByDepartureDateDesc(Long userId);

    @Query("UPDATE Trip t SET t.completed = :completed")
    void setTripCompletedEquals(boolean completed);
}