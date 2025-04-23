package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.model.dto.HouseholdDto;
import com.couple.taskmanager.model.dto.HouseholdMemberDto;
import com.couple.taskmanager.repository.CTMUserRepository;
import com.couple.taskmanager.repository.HouseholdRepository;
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
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
        HouseholdDto dto = new HouseholdDto();
        dto.setName(user.getHousehold().getName());
        dto.setHouseholdJoinKey(user.getHousehold().getHouseholdJoinKey());

        Household household = repository.findById(user.getHousehold().getId()).orElseThrow(IllegalAccessError::new);

        List<HouseholdMemberDto> members = StreamUtils.mapToList(household.getUsers(), this::map);

        dto.setMembers(members);
        return dto;
    }

    private HouseholdMemberDto map(CTMUser user){
        return new HouseholdMemberDto(user.getId(), user.getName(), user.getEmail(), user.getImageUrl());
    }

    private HouseholdDto map(Household household){
        HouseholdDto dto = new HouseholdDto();
        dto.setName(household.getName());
        dto.setHouseholdJoinKey(household.getHouseholdJoinKey());
        dto.setMembers(StreamUtils.mapToList(household.getUsers(), this::map));
        return dto;
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

        return map(repository.save(household));
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

}
