package com.couple.taskmanager.repository.finance;

import com.couple.taskmanager.model.finance.GroceryFund;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GroceryFundRepository extends JpaRepository<GroceryFund, String> {
    Optional<GroceryFund> findByHouseholdId(Long householdId);
}