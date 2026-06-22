package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.Procedure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcedureRepository extends JpaRepository<Procedure, Long> {
    List<Procedure> findAllByHouseholdId(Long householdId);
}