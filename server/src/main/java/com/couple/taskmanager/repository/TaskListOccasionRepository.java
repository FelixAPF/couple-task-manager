package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.Item;
import com.couple.taskmanager.model.TaskListOccasion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import javax.swing.text.html.Option;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskListOccasionRepository extends JpaRepository<TaskListOccasion, Long> {
    @Query("SELECT tl FROM TaskListOccasion tl WHERE tl.household.id = :householdId")
    List<TaskListOccasion> findAllByHouseholdId(Long householdId);
}
