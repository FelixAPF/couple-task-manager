package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.Meal;
import com.couple.taskmanager.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface MealRepository extends JpaRepository<Meal, Long> {

    @Query("SELECT m FROM Meal m WHERE m.household.id = :householdId AND m.date BETWEEN :startDate AND :endDate ")
    List<Meal> findByDateBetweenAndHouseholdId(Date startDate, Date endDate, Long householdId);

    @Query("SELECT m FROM Meal m WHERE m.household.id = :householdId")
    List<Meal> findAllByHouseholdId(Long householdId);

    @Query("SELECT m FROM Meal m WHERE m.date = :date AND m.household.id = :householdId")
    Optional<Meal> findByDateAndHouseholdId(@Param("date") Date date, @Param("householdId") Long householdId);

    @Query("DELETE FROM Meal m WHERE m.id = :mealId AND m.household.id = :householdId")
    void deleteByMealIdAndHouseholdId(Long mealId, Long householdId);
}
