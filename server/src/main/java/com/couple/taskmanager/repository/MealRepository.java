package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.Meal;
import com.couple.taskmanager.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface MealRepository extends JpaRepository<Meal, Long> {

    List<Meal> findByDateBetween(Date startDate, Date endDate);
}
