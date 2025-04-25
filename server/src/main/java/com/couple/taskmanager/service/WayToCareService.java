package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.WayToCare;
import com.couple.taskmanager.model.dto.WayToCareDto;
import com.couple.taskmanager.repository.CTMUserRepository;
import com.couple.taskmanager.repository.WayToCareRepository;
import com.couple.taskmanager.utils.StreamUtils;
import jakarta.transaction.SystemException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class WayToCareService implements IGenericService<WayToCare, WayToCareDto>{
    @Autowired
    WayToCareRepository repository;
    @Autowired
    CTMUserRepository userRepository;

    @Override
    public WayToCareDto get(Long id, Long householdId, CTMUser user) {
        WayToCare retrievedWayToCare = repository.findById(id).orElseThrow(NoSuchElementException::new);
        if(!retrievedWayToCare.getHousehold().getId().equals(householdId)){
            throw new IllegalArgumentException("This is not your household");
        } else if(!retrievedWayToCare.getHousehold().getEnableWaysToCare()){
            throw new IllegalArgumentException("Ways to care has not been enabled for household " + retrievedWayToCare.getHousehold().getName());
        } else {
            return new WayToCareDto(retrievedWayToCare);
        }
    }

    @Override
    public List<WayToCareDto> list(Long householdId, CTMUser user) {
        if(!user.getHousehold().getEnableWaysToCare()){
            throw new IllegalArgumentException("Ways to care has not been enabled for household " + user.getHousehold().getName());
        }
        List<WayToCare> retrievedWaysToCare = repository.findAllByHouseholdId(householdId);
        return StreamUtils.mapToList(retrievedWaysToCare, WayToCareDto::new);
    }

    @Override
    public WayToCareDto update(Long id, WayToCare wayToCare, CTMUser user) {
        if(!user.getHousehold().getEnableWaysToCare()){
            throw new IllegalArgumentException("Ways to care has not been enabled for household " + user.getHousehold().getName());
        }
        CTMUser assignee = userRepository.findById(wayToCare.getAssignee().getId()).orElseThrow(IllegalArgumentException::new);

        Optional<WayToCare> retrievedWayToCare = repository.findById(id);
        if(retrievedWayToCare.isEmpty()) return null;
        if(!retrievedWayToCare.get().getHousehold().getId().equals(user.getHousehold().getId())){
            throw new IllegalArgumentException("This is not your household");
        }

        WayToCare updatedWayToCare = retrievedWayToCare.get();
        updatedWayToCare.setTitle(wayToCare.getTitle());
        updatedWayToCare.setDescription(wayToCare.getDescription());
        updatedWayToCare.setCost(wayToCare.getCost());
        updatedWayToCare.setLocation(wayToCare.getLocation());

        updatedWayToCare.setAssignee(assignee);
        repository.save(updatedWayToCare);

        return new WayToCareDto(updatedWayToCare);
    }

    @Override
    public void delete(Long id, Long householdId, CTMUser user) {
        if(!user.getHousehold().getEnableWaysToCare()){
            throw new IllegalArgumentException("Ways to care has not been enabled for household " + user.getHousehold().getName());
        }
        WayToCare retrievedWayToCare = repository.findById(id).orElseThrow(NoSuchElementException::new);
        if(!retrievedWayToCare.getHousehold().getId().equals(householdId)){
            throw new IllegalArgumentException("This is not your household");
        } else {
            repository.delete(retrievedWayToCare);
        }
    }

    @Override
    public WayToCareDto create(WayToCare wayToCare, CTMUser user) {
        if(!user.getHousehold().getEnableWaysToCare()){
            throw new IllegalArgumentException("Ways to care has not been enabled for household " + user.getHousehold().getName());
        }
        CTMUser ctmuser = userRepository.findById(user.getId()).orElseThrow(NoSuchElementException::new);
        wayToCare.setHousehold(user.getHousehold());
        wayToCare.setAssignee(ctmuser);
        return new WayToCareDto(repository.save(wayToCare));
    }
}
