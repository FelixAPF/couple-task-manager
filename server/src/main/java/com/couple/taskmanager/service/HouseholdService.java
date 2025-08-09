package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.model.dto.HouseholdDto;
import com.couple.taskmanager.model.dto.HouseholdMemberDto;
import com.couple.taskmanager.model.dto.UpdateHouseholdSettingsDto;
import com.couple.taskmanager.repository.CTMUserRepository;
import com.couple.taskmanager.repository.HouseholdRepository;
import jakarta.transaction.SystemException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class HouseholdService {
    @Autowired
    HouseholdRepository repository;
    @Autowired
    CTMUserRepository userRepository;

    public HouseholdDto getMemberHousehold(CTMUser user){
        Household household = repository.findById(user.getHousehold().getId()).orElseThrow(IllegalAccessError::new);
        HouseholdDto householdDto = new HouseholdDto(household);
        householdDto.setCurrentUser(new HouseholdMemberDto(user));
        return householdDto;
    }

    public HouseholdDto joinHousehold(String joinKey, CTMUser user){
        Optional<Household> householdOptional = repository.findByToken(joinKey);
        if(householdOptional.isEmpty()) throw new NoSuchElementException();
        removeUserFromHousehold(user.getId(), user.getHousehold().getId());

        Household household = householdOptional.get();
        List<CTMUser> users = household.getUsers();
        users.add(user);
        household.setUsers(users);

        user.setHousehold(household);
        userRepository.save(user);

        return new HouseholdDto(repository.save(household));
    }

    public void removeUserFromHousehold(Long userId, Long householdId) {
        CTMUser user = userRepository.findById(userId).orElseThrow(NoSuchElementException::new);
        Household household = repository.findById(householdId).orElseThrow(NoSuchElementException::new);

        List<CTMUser> users = household.getUsers();
        users.remove(user);

        user.setHousehold(null); // 🚨 Important! Disconnect the reference.
        userRepository.save(user); // Make sure this is saved after removing reference

        if (users.isEmpty()) {
            repository.delete(household);
        } else {
            household.setUsers(users);
            repository.save(household);
        }
    }

    public void setHouseholdMemberImage(Long userId, String imageUrl){
        CTMUser user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + userId)); // Add specific message
        user.setImageUrl(imageUrl); // Save the full URL
        userRepository.save(user);
    }

    public HouseholdDto updateHouseholdSettings(UpdateHouseholdSettingsDto updateHouseholdSettingsDto, CTMUser user) throws SystemException {
        Household household = repository.findById(user.getHousehold().getId()).orElseThrow(SystemException::new);
        String newHouseholdName = updateHouseholdSettingsDto.getName();
        if(newHouseholdName != null && !newHouseholdName.isEmpty() && !newHouseholdName.equals(household.getName())){
            household.setName(newHouseholdName);
        }
        Boolean newEnableWaysToCare = updateHouseholdSettingsDto.getEnableWaysToCare();
        if(newEnableWaysToCare != null && !newEnableWaysToCare.equals(household.getEnableWaysToCare())){
            household.setEnableWaysToCare(newEnableWaysToCare);
        }
        Boolean newEnableToDoList = updateHouseholdSettingsDto.getEnableToDoList();
        if(newEnableToDoList != null && !newEnableToDoList.equals(household.getEnableToDoList())){
            household.setEnableToDoList(newEnableToDoList);
        }
        Boolean newEnableWishList = updateHouseholdSettingsDto.getEnableWishList();
        if(newEnableWishList != null && !newEnableWishList.equals(household.getEnableWishList())){
            household.setEnableWishList(newEnableWishList);
        }
        Boolean newEnableTravelChecklist = updateHouseholdSettingsDto.getEnableTravelChecklist();
        if(newEnableTravelChecklist != null && !newEnableTravelChecklist.equals(household.getEnableTravelChecklist())){
            household.setEnableTravelChecklist(newEnableTravelChecklist);
        }
        return new HouseholdDto(repository.save(household));
    }

    public void increaseRewardPoints(Long memberId, CTMUser user) throws SystemException {
        CTMUser member = userRepository.findById(memberId)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + memberId)); // Add specific message
        member.setRewardPoints(member.getRewardPoints()+1); // Save the full URL
        userRepository.save(member);
    }

    public void setHouseholdMemberRewardColor(Long userId, String color, CTMUser user) {
        CTMUser member = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + userId)); // Add specific message
        member.setRewardColor(color); // Save the full URL
        userRepository.save(member);
    }

    public void setRewardPoints(Long memberId, int points, CTMUser user) {
        CTMUser member = userRepository.findById(memberId)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + memberId)); // Add specific message
        member.setRewardPoints(points); // Save the full URL
        userRepository.save(member);
    }
}
