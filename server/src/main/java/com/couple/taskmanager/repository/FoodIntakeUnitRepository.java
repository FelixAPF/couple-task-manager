package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.FoodIntakeUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FoodIntakeUnitRepository extends JpaRepository<FoodIntakeUnit, Long> {

    @Query("SELECT f FROM FoodIntakeUnit f WHERE f.household.id = :householdId AND f.date BETWEEN :startDate AND :endDate ORDER BY f.date ASC")
    List<FoodIntakeUnit> findByHouseholdIdAndDateBetween(
            @Param("householdId") Long householdId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}