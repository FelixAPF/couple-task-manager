package com.couple.taskmanager.repository.finance;

import com.couple.taskmanager.model.finance.PersonalExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PersonalExpenseRepository extends JpaRepository<PersonalExpense, String> {
    @Query("SELECT p FROM PersonalExpense p WHERE p.user.id = :userId ORDER BY COALESCE(p.orderIndex, 0) ASC")
    List<PersonalExpense> findByUserIdOrderByOrderIndexAsc(@Param("userId") Long userId);

    List<PersonalExpense> findByUserId(Long userId);
}