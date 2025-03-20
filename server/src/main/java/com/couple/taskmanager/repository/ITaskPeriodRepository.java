package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.TaskPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface ITaskPeriodRepository extends JpaRepository<TaskPeriod, Long> {

    @Query("SELECT tp FROM TaskPeriod tp WHERE :date BETWEEN tp.startDate AND tp.endDate")
    List<TaskPeriod> retrieveTasksInPeriod(Date date);
}
