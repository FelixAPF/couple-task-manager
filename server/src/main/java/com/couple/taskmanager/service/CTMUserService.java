package com.couple.taskmanager.service;

import com.couple.taskmanager.enums.UserRole;
import com.couple.taskmanager.model.*;
import com.couple.taskmanager.model.dto.RegisterRequestDto;
import com.couple.taskmanager.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
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

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private MealRepository mealRepository;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private DeviceTokenRepository deviceTokenRepository;

    @Autowired
    private LetterRepository letterRepository;

    @Autowired
    private TaskListRepository taskListRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public CTMUser getCurrentUser(){
        return (CTMUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

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
        ctmUser.setBirthDay(user.getBirthDay());

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

    @Transactional
    public void deleteUserAccount(Long userId, CTMUser user) {
        CTMUser managedUser = ctmUserRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        // ---------------------------------------------------------------------
        // 0. PRE-CLEANUP: Notifications, Tokens, Letters
        // ---------------------------------------------------------------------

        // 1. Delete Notifications
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedDateDesc(managedUser);
        if (notifications != null && !notifications.isEmpty()) {
            notificationRepository.deleteAll(notifications);
        }

        // 2. Delete Device Tokens (Push Notifications)
        List<DeviceToken> tokens = deviceTokenRepository.findAllByUser(managedUser);
        if (tokens != null && !tokens.isEmpty()) {
            deviceTokenRepository.deleteAll(tokens);
        }

        // 3. Delete Letters (Sent & Received)
        // Sent letters
        List<Letter> sentLetters = letterRepository.findBySenderOrderByCreatedDateDesc(managedUser);
        if (sentLetters != null && !sentLetters.isEmpty()) {
            letterRepository.deleteAll(sentLetters);
        }

        // Received letters (Unopened)
        List<Letter> receivedUnopened = letterRepository.findByReceiverAndOpenedFalseOrderByCreatedDateDesc(managedUser);
        if (receivedUnopened != null && !receivedUnopened.isEmpty()) {
            letterRepository.deleteAll(receivedUnopened);
        }

        // Received letters (Opened)
        List<Letter> receivedOpened = letterRepository.findByReceiverAndOpenedTrueOrderByCreatedDateDesc(managedUser);
        if (receivedOpened != null && !receivedOpened.isEmpty()) {
            letterRepository.deleteAll(receivedOpened);
        }


        if (managedUser.getTaskLists() != null && !managedUser.getTaskLists().isEmpty()) {
            List<TaskList> listsToDelete = new ArrayList<>(managedUser.getTaskLists());

            for (TaskList list : listsToDelete) {
                // A. Récupérer les tâches de la liste pour les supprimer ensuite
                List<Task> tasksToDelete = new ArrayList<>();
                if (list.getTasks() != null) {
                    tasksToDelete.addAll(list.getTasks());

                    // B. IMPORTANT : Vider la liste et SAUVEGARDER
                    list.getTasks().clear();
                    taskListRepository.saveAndFlush(list);
                }

                // C. Supprimer les tâches orphelines
                if (!tasksToDelete.isEmpty()) {
                    taskRepository.deleteAll(tasksToDelete);
                }

                // D. Supprimer la liste
                taskListRepository.delete(list);
            }

            managedUser.getTaskLists().clear();
        }

        // 3. Gestion du Foyer
        Household household = managedUser.getHousehold();
        if (household != null) {
            // Remove user from the list in memory
            household.getUsers().remove(managedUser);
            managedUser.setHousehold(null);

            // REMOVED: Native Query "DELETE FROM household_users"
            // Reason: This relation is mapped via foreign key in CTMUser table, no join table exists.

            // Check if household is empty and delete or save
            if (household.getUsers().isEmpty()) {
                householdRepository.delete(household);
            } else {
                householdRepository.save(household);
            }
        }

        // 4. Suppression finale
        ctmUserRepository.delete(managedUser);
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return ctmUserRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }
}
