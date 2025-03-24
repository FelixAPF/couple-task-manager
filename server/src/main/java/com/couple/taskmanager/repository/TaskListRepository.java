package com.couple.taskmanager.repository;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.model.Task;
import com.couple.taskmanager.model.TaskList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface TaskListRepository extends JpaRepository<TaskList, Long> {
    TaskList findByAssignee(Assignee assignee);

}
