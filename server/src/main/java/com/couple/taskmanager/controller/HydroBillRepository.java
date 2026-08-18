package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.finance.HydroBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HydroBillRepository extends JpaRepository<HydroBill, String> {

    // Trouve toutes les factures d'un ménage, triées de la plus récente à la plus ancienne
    List<HydroBill> findByHouseholdIdOrderByPeriodEndDesc(String householdId);
}