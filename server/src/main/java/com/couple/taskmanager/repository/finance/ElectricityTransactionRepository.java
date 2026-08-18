package com.couple.taskmanager.repository.finance;

import com.couple.taskmanager.model.finance.ElectricityTransaction;
import com.couple.taskmanager.model.finance.GroceryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ElectricityTransactionRepository extends JpaRepository<ElectricityTransaction, String> {
    List<ElectricityTransaction> findByHouseholdIdOrderByDateDesc(Long householdId);
}