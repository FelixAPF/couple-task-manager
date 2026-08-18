package com.couple.taskmanager.repository.finance;

import com.couple.taskmanager.model.finance.GroceryTransaction;
import com.couple.taskmanager.model.finance.HouseholdTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HouseholdTransactionRepository extends JpaRepository<HouseholdTransaction, String> {
    List<HouseholdTransaction> findByHouseholdIdOrderByDateDesc(Long householdId);
}