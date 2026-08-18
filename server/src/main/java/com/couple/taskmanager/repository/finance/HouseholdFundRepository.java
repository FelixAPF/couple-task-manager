package com.couple.taskmanager.repository.finance;

import com.couple.taskmanager.model.finance.GroceryFund;
import com.couple.taskmanager.model.finance.HouseholdFund;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HouseholdFundRepository extends JpaRepository<HouseholdFund, String> {
    Optional<HouseholdFund> findByHouseholdId(Long householdId);
}