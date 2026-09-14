package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    @Query("SELECT DISTINCT t FROM Trip t LEFT JOIN FETCH t.items WHERE t.user.id = :userId ORDER BY t.departureDate DESC")
    List<Trip> findByUserIdWithItems(@Param("userId") Long userId);

    @Query("UPDATE Trip t SET t.completed = :completed")
    void setTripCompletedEquals(boolean completed);
}