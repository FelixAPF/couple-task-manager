package com.couple.taskmanager.repository.finance;

import com.couple.taskmanager.model.finance.ElectricityFund;
import com.couple.taskmanager.model.finance.GroceryFund;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ElectricityFundRepository extends JpaRepository<ElectricityFund, String> {
    Optional<ElectricityFund> findByHouseholdId(Long householdId);
}