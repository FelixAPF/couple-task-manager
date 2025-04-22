package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.model.ShoppingItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    @Query("SELECT r FROM Recipe r WHERE r.category = :recipeType AND r.household.id = :householdId")
    List<Recipe> findByRecipeTypeAndHouseholdId(String recipeType, Long householdId);

    @Query("SELECT r FROM Recipe r WHERE r.household.id = :householdId")
    List<Recipe> findAllByHouseholdId(Long householdId);

    @Query("DELETE FROM Recipe r WHERE r.id = :recipeId AND r.household.id = :householdId")
    void deleteByRecipeIdAndHouseholdId(Long recipeId, Long householdId);
}
