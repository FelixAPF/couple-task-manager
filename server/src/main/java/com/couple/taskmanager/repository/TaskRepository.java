package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.dto.TaskWithCompletedDateV1;
import jakarta.persistence.Tuple;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("SELECT t, (SELECT MAX(ta.completedDate) FROM TaskAssignment ta WHERE ta.task = t) FROM Task t " +
            "WHERE NOT EXISTS (SELECT 1 FROM TaskAssignment ta WHERE ta.task = t AND ta.completedDate IS NOT NULL) " +
            "OR (EXISTS (SELECT 1 FROM TaskAssignment ta2 WHERE ta2.task = t AND ta2.completedDate IS NOT NULL) " +
            "AND (SELECT MAX(ta3.completedDate) FROM TaskAssignment ta3 WHERE ta3.task = t) < :longTime)")
    List<Tuple> retrieveTasksNotCompletedInLongTime(@Param("longTime") Date longTime);

    @Query("SELECT t FROM Task t WHERE t.household.id = :householdId")
    List<Task> findAllByHouseholdId(@Param("householdId") Long householdId);
}
