package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.TaskPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Repository
public interface ITaskPeriodRepository extends JpaRepository<TaskPeriod, Long> {
    List<TaskPeriod> findByCompletedFalse();

    @Query("SELECT tp FROM TaskPeriod tp WHERE :date BETWEEN tp.startDate AND tp.endDate")
    List<TaskPeriod> retrieveTasksInPeriod(Date date);

    @Query("SELECT ta.taskPeriod FROM TaskAssignment ta WHERE ta.id = :assignmentId")
    TaskPeriod findByTaskAssignmentId(Long assignmentId);

    @Modifying
    @Transactional
    @Query("UPDATE TaskPeriod tp SET tp.completed = true WHERE tp.id = :periodId")
    void markAsCompleted(Long periodId);
}
