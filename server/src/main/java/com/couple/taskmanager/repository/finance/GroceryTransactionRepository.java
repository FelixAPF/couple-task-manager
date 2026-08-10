package com.couple.taskmanager.repository.finance;

import com.couple.taskmanager.model.finance.GroceryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GroceryTransactionRepository extends JpaRepository<GroceryTransaction, String> {
    List<GroceryTransaction> findByHouseholdIdOrderByDateDesc(Long householdId);
}