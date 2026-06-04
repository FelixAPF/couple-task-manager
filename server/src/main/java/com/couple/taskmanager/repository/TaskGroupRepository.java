package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.TaskGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskGroupRepository extends JpaRepository<TaskGroup, Long> {
    List<TaskGroup> findAllByHouseholdId(Long householdId);
    Optional<TaskGroup> findByIdAndHouseholdId(Long id, Long householdId);
}