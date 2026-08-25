package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.TaskHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface TaskHistoryRepository extends JpaRepository<TaskHistory, Long> {
    List<TaskHistory> findByTaskId(Long taskId);

    @Query("SELECT th FROM TaskHistory th WHERE th.completedBy.household.id = :householdId AND th.completedDate >= :startOfDay ORDER BY th.completedDate DESC")
    List<TaskHistory> findTodayByHousehold(@Param("householdId") Long householdId, @Param("startOfDay") Date startOfDay);

    List<TaskHistory> findByCompletedByIdAndIsThankedTrueAndThankYouSeenFalse(Long userId);

    // Query for tasks completed in date range for a household
    @Query("SELECT th FROM TaskHistory th WHERE th.task.household.id = :householdId AND th.completedDate BETWEEN :startDate AND :endDate")
    List<TaskHistory> findByHouseholdIdAndCompletedDateBetween(
            @Param("householdId") Long householdId,
            @Param("startDate") Date startDate,
            @Param("endDate") Date endDate
    );
}