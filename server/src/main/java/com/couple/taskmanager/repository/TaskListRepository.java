package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.TaskList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskListRepository extends JpaRepository<TaskList, Long> {
    @Query("SELECT tl FROM TaskList tl WHERE tl.user.id = :userId AND tl.household.id = :householdId")
    Optional<TaskList> findByAssignee(@Param("userId") Long userId, @Param("householdId") Long householdId);


    @Query("SELECT tl FROM TaskList tl JOIN tl.tasks t WHERE t.id = :taskId AND tl.household.id = :householdId")
    TaskList findByTaskId(@Param("taskId") Long taskId, @Param("householdId") Long householdId);

    @Query("SELECT tl FROM TaskList tl WHERE tl.household.id = :householdId")
    List<TaskList> findAllByHouseholdId(@Param("householdId") Long householdId);

    // *** CORRECTED QUERY ***
    // Changed tl.assignee.id to tl.user.id to match the likely entity field name
    @Query("SELECT tl FROM TaskList tl LEFT JOIN FETCH tl.tasks WHERE tl.user.id = :assigneeId AND tl.household.id = :householdId")
    Optional<TaskList> findByAssigneeIdAndHouseholdId(@Param("assigneeId") Long assigneeId, @Param("householdId") Long householdId);
}
