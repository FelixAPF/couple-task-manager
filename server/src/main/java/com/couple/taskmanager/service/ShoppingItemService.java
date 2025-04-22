package com.couple.taskmanager.service;

import com.couple.taskmanager.model.*;
import com.couple.taskmanager.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ShoppingItemService implements IGenericService<ShoppingItem> {
    @Autowired
    ShoppingItemRepository repository;

    @Override
    public ShoppingItem get(Long id, Long householdId, CTMUser user) {
        return repository.findById(id)
                .orElseThrow(IllegalArgumentException::new);
    }

    @Override
    public List<ShoppingItem> list(Long householdId, CTMUser user) {
        return repository.findAll();
    }

    public List<ShoppingItem> listByNotBought(CTMUser user){
        return repository.findAllByBoughtFalseAndHouseholdId(user.getHousehold().getId());
    }

    public List<String> listNameSuggestions(){
        return repository.findDistinctByName();
    }

    @Override
    public ShoppingItem update(Long id, ShoppingItem shoppingItem, CTMUser user) {
        return repository.save(shoppingItem);
    }

    @Override
    public void delete(Long id, Long householdId, CTMUser user) {
        repository.markAsBought(id, user.getHousehold().getId());
    }

    @Override
    public ShoppingItem create(ShoppingItem shoppingItem, CTMUser user) {
        if(shoppingItem.getHousehold() == null){
            shoppingItem.setHousehold(user.getHousehold());
        }
        return repository.save(shoppingItem);
    }

}
