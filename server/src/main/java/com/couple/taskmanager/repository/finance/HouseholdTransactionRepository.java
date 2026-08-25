package com.couple.taskmanager.repository.finance;

import com.couple.taskmanager.model.finance.HouseholdTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Date;
import java.util.List;

public interface HouseholdTransactionRepository extends JpaRepository<HouseholdTransaction, String> {
    List<HouseholdTransaction> findByHouseholdIdOrderByDateDesc(Long householdId);

    // Query for household transactions in date range
    @Query("SELECT ht FROM HouseholdTransaction ht WHERE ht.household.id = :householdId AND ht.date BETWEEN :startDate AND :endDate")
    List<HouseholdTransaction> findByHouseholdIdAndDateBetween(
            @Param("householdId") Long householdId,
            @Param("startDate") Date startDate,
            @Param("endDate") Date endDate
    );
}