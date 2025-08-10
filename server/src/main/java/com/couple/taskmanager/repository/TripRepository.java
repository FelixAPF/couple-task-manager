package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByUserIdOrderByDepartureDateDesc(Long userId);


    void setTripCompletedEquals(boolean completed);
}