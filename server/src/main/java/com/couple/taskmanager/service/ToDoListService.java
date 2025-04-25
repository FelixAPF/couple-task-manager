package com.couple.taskmanager.service;

import com.couple.taskmanager.enums.ToDoStatus;
import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.model.ToDoItem;
import com.couple.taskmanager.model.WayToCare;
import com.couple.taskmanager.model.dto.ToDoItemDto;
import com.couple.taskmanager.repository.HouseholdRepository;
import com.couple.taskmanager.repository.ToDoItemRepository;
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class ToDoListService implements IGenericService<ToDoItem, ToDoItemDto>{
    @Autowired
    ToDoItemRepository repository;
    @Autowired
    HouseholdRepository householdRepository;

    @Override
    public ToDoItemDto get(Long id, Long householdId, CTMUser user) {
        if(!user.getHousehold().getEnableToDoList()){
            throw new IllegalArgumentException("To do list has not been enabled for household " + user.getHousehold().getName());
        }
        ToDoItem retrievedToDoItem = repository.findById(id).orElseThrow(NoSuchElementException::new);
        return new ToDoItemDto(retrievedToDoItem);
    }

    @Override
    public List<ToDoItemDto> list(Long householdId, CTMUser user) {
        if(!user.getHousehold().getEnableToDoList()){
            throw new IllegalArgumentException("To do list has not been enabled for household " + user.getHousehold().getName());
        }
        List<ToDoItem> retrievedToDoItems = repository.findAllByHouseholdId(householdId);
        return StreamUtils.mapToList(retrievedToDoItems, ToDoItemDto::new);
    }

    @Override
    public ToDoItemDto update(Long id, ToDoItem toDoItem, CTMUser user) {
        if(!user.getHousehold().getEnableToDoList()){
            throw new IllegalArgumentException("To do list has not been enabled for household " + user.getHousehold().getName());
        }
        ToDoItem retrievedToDoItem = repository.findById(id).orElseThrow(NoSuchElementException::new);
        retrievedToDoItem.setTitle(toDoItem.getTitle());
        retrievedToDoItem.setDescription(toDoItem.getDescription());
        retrievedToDoItem.setCost(toDoItem.getCost());
        retrievedToDoItem.setStatus(toDoItem.getStatus());
        retrievedToDoItem.setLocation(toDoItem.getLocation());

        return new ToDoItemDto(repository.save(retrievedToDoItem));
    }

    @Override
    public void delete(Long id, Long householdId, CTMUser user) {
        if(!user.getHousehold().getEnableToDoList()){
            throw new IllegalArgumentException("To do list has not been enabled for household " + user.getHousehold().getName());
        }
        ToDoItem retrievedToDoItem = repository.findById(id).orElseThrow(NoSuchElementException::new);
        repository.delete(retrievedToDoItem);
    }

    @Override
    public ToDoItemDto create(ToDoItem toDoItem, CTMUser user) {
        Household household = householdRepository.findById(user.getHousehold().getId()).orElseThrow(NoSuchElementException::new);
        if(!household.getEnableToDoList()){
            throw new IllegalArgumentException("To do list has not been enabled for household " + user.getHousehold().getName());
        }
        toDoItem.setHousehold(household);
        toDoItem.setStatus(ToDoStatus.TO_DO);
        return new ToDoItemDto(repository.save(toDoItem));
    }

    public void updateStatus(Long toDoItemId, ToDoStatus toDoStatus, CTMUser user){
        if(!user.getHousehold().getEnableToDoList()){
            throw new IllegalArgumentException("To do list has not been enabled for household " + user.getHousehold().getName());
        }
        ToDoItem toDoItem = repository.findById(toDoItemId).orElseThrow(NoSuchElementException::new);
        toDoItem.setStatus(toDoStatus);
        if(toDoStatus == ToDoStatus.TO_DO){
            toDoItem.setRating(null);
        }
        repository.save(toDoItem);
    }

    public void rateAndCompleteItem(Long toDoItemId, double rating, CTMUser user) {
        if(!user.getHousehold().getEnableToDoList()){
            throw new IllegalArgumentException("To do list has not been enabled for household " + user.getHousehold().getName());
        }
        ToDoItem toDoItem = repository.findById(toDoItemId).orElseThrow(NoSuchElementException::new);
        toDoItem.setStatus(ToDoStatus.COMPLETED);
        toDoItem.setRating(rating);
        repository.save(toDoItem);
    }
}
