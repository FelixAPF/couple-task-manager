package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.FoodIntakeUnitGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FoodIntakeUnitGoalRepository extends JpaRepository<FoodIntakeUnitGoal, Long> {

    Optional<FoodIntakeUnitGoal> findByAssigneeIdAndEffectiveDate(Long assigneeId, LocalDate effectiveDate);

    // Everything up to and including endDate, most recent first — enough to resolve
    // the applicable goal for every day in a week view with one query.
    List<FoodIntakeUnitGoal> findByAssigneeIdAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(
            Long assigneeId, LocalDate endDate);
}