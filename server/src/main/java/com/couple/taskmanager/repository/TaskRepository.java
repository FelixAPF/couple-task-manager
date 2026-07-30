package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.Task;
import jakarta.persistence.Tuple;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.*;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("SELECT t FROM Task t WHERE t.household.id = :householdId")
    List<Task> findAllByHouseholdId(@Param("householdId") Long householdId);

    @Query("SELECT t FROM Task t WHERE t.id = :taskId AND t.household.id = :householdId")
    Optional<Task> findByIdAndHouseholdId(@Param("taskId")Long taskId,@Param("householdId") Long householdId);

    @Query("SELECT t FROM Task t WHERE t.dueDate <= :now AND t.isNotified = false AND t.doNotify = true")
    List<Task> findAllTaskDue(@Param("now") Date now);

    @Query("DELETE FROM Task t WHERE t.id = :taskId AND t.household.id = :householdId")
    void deleteByIdAndHouseholdId(@Param("taskId")Long taskId,@Param("householdId") Long householdId);

    @Query("SELECT t FROM Task t WHERE t.id IN :requestedTaskIds AND t.household.id = :householdId")
    List<Task> findAllByIdInAndHouseholdId(@Param("requestedTaskIds") Set<Long> requestedTaskIds, @Param("householdId") Long householdId);

    @Query("SELECT t FROM Task t WHERE t.household.id = :householdId AND (t.assignee.id = :userId OR t.assignee IS NULL)")
    List<Task> findDashboardTasks(@Param("householdId") Long householdId, @Param("userId") Long userId);

    List<Task> findByHouseholdIdAndAssigneeIdOrAssigneeIsNull(Long id, Long id1);

    @Query("SELECT t FROM Task t WHERE t.household.id = :householdId " +
            "AND (t.assignee.id = :userId OR t.assignee IS NULL) " +
            "AND t.dueDate <= :maxDueDate")
    List<Task> findDashboardTasksWithHorizon(
            @Param("householdId") Long householdId,
            @Param("userId") Long userId,
            @Param("maxDueDate") Date maxDueDate);
}
