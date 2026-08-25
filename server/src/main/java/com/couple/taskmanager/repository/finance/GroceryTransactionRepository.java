package com.couple.taskmanager.repository.finance;

import com.couple.taskmanager.model.finance.GroceryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Date;
import java.util.List;

public interface GroceryTransactionRepository extends JpaRepository<GroceryTransaction, String> {
    List<GroceryTransaction> findByHouseholdIdOrderByDateDesc(Long householdId);

    // Query for grocery transactions in date range
    @Query("SELECT gt FROM GroceryTransaction gt WHERE gt.household.id = :householdId AND gt.date BETWEEN :startDate AND :endDate")
    List<GroceryTransaction> findByHouseholdIdAndDateBetween(
            @Param("householdId") Long householdId,
            @Param("startDate") Date startDate,
            @Param("endDate") Date endDate
    );
}