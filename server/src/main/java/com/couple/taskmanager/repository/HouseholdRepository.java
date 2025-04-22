package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Household;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Optional;

@Repository
public interface HouseholdRepository extends JpaRepository<Household, Long> {

    @Query("SELECT h FROM Household h WHERE h.householdJoinKey = :token")
    Optional<Household> findByToken(@PathVariable("token") String token);

}
