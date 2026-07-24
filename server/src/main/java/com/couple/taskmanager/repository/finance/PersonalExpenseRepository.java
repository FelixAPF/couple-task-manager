package com.couple.taskmanager.repository.finance;

import com.couple.taskmanager.model.finance.PersonalExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PersonalExpenseRepository extends JpaRepository<PersonalExpense, String> {
    List<PersonalExpense> findByUserId(Long userId);
}