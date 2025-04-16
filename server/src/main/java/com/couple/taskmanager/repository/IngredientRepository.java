package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.Ingredient;
import com.couple.taskmanager.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

}
