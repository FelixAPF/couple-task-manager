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
    public ShoppingItem get(Long id, CTMUser user) {
        return repository.findById(id)
                .orElseThrow(IllegalArgumentException::new);
    }

    @Override
    public List<ShoppingItem> list(CTMUser user) {
        return repository.findAll();
    }

    public List<ShoppingItem> listByNotBought(){
        return repository.findAllByBoughtFalse();
    }

    public List<String> listNameSuggestions(){
        return repository.findDistinctByName();
    }

    @Override
    public ShoppingItem update(Long id, ShoppingItem shoppingItem, CTMUser user) {
        return repository.save(shoppingItem);
    }

    @Override
    public void delete(Long id, CTMUser user) {
        repository.markAsBought(id);
    }

    @Override
    public ShoppingItem create(ShoppingItem shoppingItem, CTMUser user) {
        return repository.save(shoppingItem);
    }

}
