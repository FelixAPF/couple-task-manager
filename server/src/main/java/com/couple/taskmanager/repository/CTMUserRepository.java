package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Meal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface CTMUserRepository extends JpaRepository<CTMUser, Long> {
    Optional<CTMUser> findByEmail(String email); // Added findByEmail

    @Query("SELECT u FROM CTMUser u WHERE u.id = :userId AND u.household.id = :householdId")
    Optional<CTMUser> findByIdAndHouseholdId(@Param("userId") Long userId, @Param("householdId") Long householdId);

    @Query("SELECT u FROM CTMUser u WHERE u.id IN :userIds AND u.household.id = :householdId")
    List<CTMUser> findAllByIdInAndHouseholdId(@Param("userIds") Set<Long> userIds, @Param("householdId") Long householdId);
}
