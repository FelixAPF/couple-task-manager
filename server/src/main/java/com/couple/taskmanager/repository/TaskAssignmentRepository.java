package com.couple.taskmanager.repository;

import com.couple.taskmanager.enums.Assignee;
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

    List<TaskAssignment> findAllByTaskId(Long taskId);

    List<TaskAssignment> findAllByCompletedFalseAndAssigneeAndDueDateLessThanEqual(Assignee assignee, Date dueDateInMonth);

    @Modifying
    @Transactional
    @Query("UPDATE TaskAssignment ta SET ta.completed = :completed WHERE ta.id = :assignmentId")
    void setAssignmentCompleted(@Param("assignmentId") Long assignmentId, @Param("completed") boolean completed);

    List<TaskAssignment> findAllByTaskPeriodId(Long periodId);
}
