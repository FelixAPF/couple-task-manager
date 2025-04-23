package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.TaskAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Repository
public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, Long> {
    @Query("SELECT ta FROM TaskAssignment ta WHERE ta.task.id = :taskId AND ta.completed = true AND ta.task.household.id = :householdId")
    List<TaskAssignment> findAllByTaskIdAndCompletedTrueAndHouseholdId(Long taskId,@Param("householdId") Long householdId);

    @Query("SELECT ta FROM TaskAssignment ta WHERE ta.completed = :completed AND ta.task.household.id = :householdId")
    List<TaskAssignment> findAllByCompletedEqualsAndHouseholdId(Boolean completed, @Param("householdId") Long householdId);

    @Transactional
    void deleteAllByTaskId(Long taskId);

    @Query("SELECT ta FROM TaskAssignment ta JOIN FETCH ta.taskPeriod WHERE ta.completed = false AND ta.assignee.id = :assignedUserId AND ta.dueDate <= :dueDateInMonth AND ta.task.household.id = :householdId")
    List<TaskAssignment> findAllByCompletedFalseAndAssigneeAndDueDateLessThanEqual(Long assignedUserId, Date dueDateInMonth, @Param("householdId") Long householdId);

    @Query("SELECT ta FROM TaskAssignment ta WHERE ta.completed = true AND DATE(ta.completedDate) = DATE(:completedDate) AND ta.task.household.id = :householdId")
    List<TaskAssignment> findAllByCompletedTrueAndCompletedDateSameDayAndHouseholdId(Date completedDate, @Param("householdId") Long householdId);

    @Modifying
    @Transactional
    @Query("UPDATE TaskAssignment ta SET ta.completed = :completed, ta.completedDate = :date WHERE ta.id = :assignmentId")
    void setAssignmentCompleted(@Param("assignmentId") Long assignmentId, @Param("completed") boolean completed, @Param("date") Date date);

    List<TaskAssignment> findAllByTaskPeriodId(Long periodId);

    @Query("SELECT ta FROM TaskAssignment ta WHERE ta.completed = true AND ta.task.id = :taskId")
    List<TaskAssignment> findAllCompletedTrueAndTaskId(Long taskId);

    @Query("SELECT ta FROM TaskAssignment ta WHERE ta.task.household.id = :householdId")
    List<TaskAssignment> findAllByHouseholdId(@Param("householdId") Long householdId);
}
