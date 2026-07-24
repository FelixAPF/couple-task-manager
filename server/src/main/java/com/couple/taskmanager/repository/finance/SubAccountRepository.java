package com.couple.taskmanager.repository.finance;

import com.couple.taskmanager.model.finance.SubAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubAccountRepository extends JpaRepository<SubAccount, String> {
}