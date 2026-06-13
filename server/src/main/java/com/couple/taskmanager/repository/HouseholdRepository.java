package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Household;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Optional;

@Repository
public interface HouseholdRepository extends JpaRepository<Household, Long> {

    @Query("SELECT h FROM Household h WHERE h.householdJoinKey = :token")
    Optional<Household> findByToken(@PathVariable("token") String token);

    @Query("SELECT h FROM Household h LEFT JOIN FETCH h.users WHERE h.id = :id")
    Optional<Household> findByIdWithUser(@Param("id") Long id);

    @Override // Good practice to add Override if redefining a base interface method
    @EntityGraph(attributePaths = {"users"}) // Specify the relationship to fetch
    Optional<Household> findById(Long id);

    @Query("SELECT u FROM CTMUser u WHERE u.household.id = :id")
    List<CTMUser> findUsersByHouseholdId(Long id);
}
