package com.couple.taskmanager.repository;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskListRepository extends JpaRepository<TaskList, Long> {
    TaskList findByAssignee(Assignee assignee);

    @Query("SELECT tl FROM TaskList tl JOIN tl.tasks t WHERE t.id = :taskId")
    TaskList findByTaskId(@Param("taskId") Long taskId);

    @Query("SELECT tl FROM TaskList tl WHERE tl.household.id = :householdId")
    List<TaskList> findAllByHouseholdId(@Param("householdId") Long householdId);
}
