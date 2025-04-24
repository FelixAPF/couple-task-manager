package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.TaskPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface ITaskPeriodRepository extends JpaRepository<TaskPeriod, Long> {
    @Query("SELECT tp FROM TaskPeriod tp WHERE tp.household.id = :householdId AND tp.completed = false")
    List<TaskPeriod> findByCompletedFalse(Long householdId);

    @Query("SELECT tp FROM TaskPeriod tp WHERE :date BETWEEN tp.startDate AND tp.endDate AND tp.household.id = :householdId")
    List<TaskPeriod> retrieveTasksInPeriod(Date date, Long householdId);

    @Query("SELECT ta.taskPeriod FROM TaskAssignment ta WHERE ta.id = :assignmentId AND ta.household.id = :householdId")
    TaskPeriod findByTaskAssignmentId(Long assignmentId, Long householdId);

    @Modifying
    @Transactional
    @Query("UPDATE TaskPeriod tp SET tp.completed = true, tp.completedDate = :date WHERE tp.id = :periodId")
    void markAsCompleted(Long periodId, @Param("date") Date date);

    @Query("SELECT tp FROM TaskPeriod tp WHERE tp.household.id = :householdId")
    List<TaskPeriod> findAllByHouseholdId(Long householdId);

    @Query("SELECT tp FROM TaskPeriod tp WHERE tp.id = :periodId AND tp.household.id = :householdId")
    Optional<TaskPeriod> findByIdAndHouseholdId(Long periodId, Long id);
}
