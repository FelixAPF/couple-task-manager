package com.couple.taskmanager.repository.finance;

import com.couple.taskmanager.model.finance.CommonExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommonExpenseRepository extends JpaRepository<CommonExpense, String> {
    List<CommonExpense> findByHouseholdId(Long householdId);
}