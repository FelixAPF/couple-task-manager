package com.couple.taskmanager.service;

import com.couple.taskmanager.enums.Assignee;
import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.model.*;
import com.couple.taskmanager.model.dto.ShoppingItemV1;
import com.couple.taskmanager.model.dto.TaskWithCompletedDateV1;
import com.couple.taskmanager.repository.*;
import com.couple.taskmanager.utils.DateUtils;
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class ShoppingItemService implements IGenericService<ShoppingItem> {
    @Autowired
    ShoppingItemRepository repository;

    @Override
    public ShoppingItem get(Long id) {
        return repository.findById(id)
                .orElseThrow(IllegalArgumentException::new);
    }

    @Override
    public List<ShoppingItem> list() {
        return repository.findAll();
    }

    public List<ShoppingItem> listByNotBought(){
        return repository.findAllByBoughtFalse();
    }

    public List<String> listNameSuggestions(){
        return repository.findDistinctByName();
    }

    @Override
    public ShoppingItem update(Long id, ShoppingItem shoppingItem) {
        return repository.save(shoppingItem);
    }

    @Override
    public void delete(Long id) {
        repository.markAsBought(id);
    }

    @Override
    public ShoppingItem create(ShoppingItem shoppingItem) {
        return repository.save(shoppingItem);
    }

}
