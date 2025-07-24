package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.Contact;
import com.couple.taskmanager.model.WayToCare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {
    @Query("SELECT c FROM Contact c WHERE c.household.id = :householdId")
    List<Contact> findAllByHouseholdId(@Param("householdId") Long householdId);
}
