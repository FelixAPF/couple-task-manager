package com.couple.taskmanager.repository.finance;

import com.couple.taskmanager.model.finance.CommonExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommonExpenseRepository extends JpaRepository<CommonExpense, String> {
    @Query("SELECT c FROM CommonExpense c WHERE c.household.id = :householdId ORDER BY COALESCE(c.orderIndex, 0) ASC")
    List<CommonExpense> findByHouseholdIdOrderByOrderIndexAsc(@Param("householdId") Long householdId);

    List<CommonExpense> findByHouseholdId(Long householdId);
}