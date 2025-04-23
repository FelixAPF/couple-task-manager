package com.couple.taskmanager.service;

import com.couple.taskmanager.model.*;
import com.couple.taskmanager.model.dto.ShoppingItemDto;
import com.couple.taskmanager.repository.*;
import com.couple.taskmanager.utils.StreamUtils;
import jakarta.transaction.SystemException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ShoppingItemService implements IGenericService<ShoppingItem, ShoppingItemDto> {
    @Autowired
    ShoppingItemRepository repository;
    @Autowired
    HouseholdRepository householdRepository;

    @Override
    public ShoppingItemDto get(Long id, Long householdId, CTMUser user) {
        return repository.findById(id).map(ShoppingItemDto::new)
                .orElseThrow(IllegalArgumentException::new);
    }

    @Override
    public List<ShoppingItemDto> list(Long householdId, CTMUser user) {
        return StreamUtils.ofNullable(repository.findAll()).map(ShoppingItemDto::new).toList();
    }

    public List<ShoppingItemDto> listByNotBought(CTMUser user){
        return StreamUtils.ofNullable(repository.findAllByBoughtFalseAndHouseholdId(user.getHousehold().getId())).map(ShoppingItemDto::new).toList();
    }

    public List<String> listNameSuggestions(){
        return repository.findDistinctByName();
    }

    @Override
    public ShoppingItemDto update(Long id, ShoppingItem shoppingItem, CTMUser user) {
        return new ShoppingItemDto(repository.save(shoppingItem));
    }

    @Override
    public void delete(Long id, Long householdId, CTMUser user) {
        repository.markAsBought(id, user.getHousehold().getId());
    }

    @Override
    public ShoppingItemDto create(ShoppingItem shoppingItem, CTMUser user) {
        Household household = householdRepository.findById(user.getHousehold().getId())
                .orElseThrow(() -> new IllegalArgumentException("User's household not found"));
        shoppingItem.setId(null);

        if(shoppingItem.getHousehold() == null){
            shoppingItem.setHousehold(household);
        }
        shoppingItem.setBought(false);
        ShoppingItem savedItem = repository.save(shoppingItem); // Line 56 (now correct)
        return new ShoppingItemDto(savedItem);
    }

}
