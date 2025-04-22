package com.couple.taskmanager.service;

import com.couple.taskmanager.enums.UserRole;
import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.model.dto.RegisterRequestDto;
import com.couple.taskmanager.repository.CTMUserRepository;
import com.couple.taskmanager.repository.HouseholdRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class CTMUserService implements UserDetailsService {

    @Autowired
    private CTMUserRepository ctmUserRepository;

    @Autowired
    private HouseholdRepository householdRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;


    public CTMUser get(Long id, CTMUser user) {
        return ctmUserRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No user with id " + id));
    }


    public List<CTMUser> list(CTMUser user) {
        return ctmUserRepository.findAll();
    }


    public CTMUser update(Long id, CTMUser user) {
        if (!ctmUserRepository.existsById(id)) {
            throw new NoSuchElementException("No user with id " + id);
        }
        user.setPassword(passwordEncoder.encode(user.getPassword())); // Re-encode if password is changed
        return ctmUserRepository.save(user);
    }


    public void delete(Long id) {
        ctmUserRepository.deleteById(id);
    }


    public CTMUser create(CTMUser user) {
        // Check if email already exists
        Optional<CTMUser> existingUser = ctmUserRepository.findByEmail(user.getEmail());
        if(existingUser.isPresent()){
            throw new IllegalStateException("User with email " + user.getEmail() + " already exists");
        }
        // Encode the password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        // Set default role
        if(user.getRole() == null){
            user.setRole(UserRole.USER);
        }
        return ctmUserRepository.save(user);
    }

    @Transactional // Add transactional annotation to manage the persistence context
    public CTMUser register(RegisterRequestDto user) {
        if(!user.isCreateNewHousehold() && user.getHouseholdToken() == null) throw new IllegalArgumentException();

        // Check if email already exists
        Optional<CTMUser> existingUser = ctmUserRepository.findByEmail(user.getEmail());
        if(existingUser.isPresent()){
            throw new IllegalStateException("User with email " + user.getEmail() + " already exists");
        }
        CTMUser ctmUser = new CTMUser();
        ctmUser.setEmail(user.getEmail());
        ctmUser.setPassword(passwordEncoder.encode(user.getPassword()));
        ctmUser.setName(user.getName());
        ctmUser.setRole(UserRole.USER);

        Household household = householdRepository.findByToken(user.getHouseholdToken()).orElse(null);
        if(household == null){
            household = new Household();
            household.setName(user.getNewHouseholdName());
            household.setHouseholdJoinKey(String.valueOf(UUID.randomUUID()));
            household.setUsers(new ArrayList<>()); // Initialize the list
            household.setCreatedDated(new Date());

            householdRepository.save(household); // Save the new household FIRST
            household.getUsers().add(ctmUser); // Now add the user
            ctmUser.setHousehold(household);
        } else {
            List<CTMUser> users = household.getUsers();
            users.add(ctmUser);
            household.setUsers(users);
            ctmUser.setHousehold(household);
        }

        return ctmUserRepository.save(ctmUser);
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return ctmUserRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }
}
