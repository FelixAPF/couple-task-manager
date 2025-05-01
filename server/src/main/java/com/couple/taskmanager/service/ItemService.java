package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Item;
import com.couple.taskmanager.model.dto.ItemDto;
import com.couple.taskmanager.repository.CTMUserRepository;
import com.couple.taskmanager.repository.ItemRepository;
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class ItemService implements IGenericService<Item, ItemDto>{
    @Autowired
    ItemRepository repository;
    @Autowired
    CTMUserRepository userRepository;

    @Override
    public ItemDto get(Long id, Long householdId, CTMUser user) {
        Item retrievedItem = repository.findById(id).orElseThrow(NoSuchElementException::new);
        if(!retrievedItem.getHousehold().getId().equals(householdId)){
            throw new IllegalArgumentException("This is not your household");
        } else if(!retrievedItem.getHousehold().getEnableWishList()){
            throw new IllegalArgumentException("Wish lists has not been enabled for household " + retrievedItem.getHousehold().getName());
        } else {
            return new ItemDto(retrievedItem);
        }
    }

    @Override
    public List<ItemDto> list(Long householdId, CTMUser user) {
        if(!user.getHousehold().getEnableWishList()){
            throw new IllegalArgumentException("Wish lists has not been enabled for household " + user.getHousehold().getName());
        }
        List<Item> retrievedItems = repository.findAllByHouseholdId(householdId);
        return StreamUtils.mapToList(retrievedItems, ItemDto::new);
    }

    @Override
    public ItemDto update(Long id, Item item, CTMUser user) {
        if(!user.getHousehold().getEnableWishList()){
            throw new IllegalArgumentException("Wish lists has not been enabled for household " + user.getHousehold().getName());
        }
        CTMUser assignee = userRepository.findById(item.getAssignee().getId()).orElseThrow(IllegalArgumentException::new);

        Optional<Item> retrievedItem = repository.findById(id);
        if(retrievedItem.isEmpty()) return null;
        if(!retrievedItem.get().getHousehold().getId().equals(user.getHousehold().getId())){
            throw new IllegalArgumentException("This is not your household");
        }

        Item updatedItem = retrievedItem.get();
        updatedItem.setTitle(item.getTitle());
        updatedItem.setDescription(item.getDescription());
        updatedItem.setCost(item.getCost());
        updatedItem.setLink(item.getLink());

        updatedItem.setAssignee(assignee);
        repository.save(updatedItem);

        return new ItemDto(updatedItem);
    }

    @Override
    public void delete(Long id, Long householdId, CTMUser user) {
        if(!user.getHousehold().getEnableWishList()){
            throw new IllegalArgumentException("Wish lists has not been enabled for household " + user.getHousehold().getName());
        }
        Item retrievedItem = repository.findById(id).orElseThrow(NoSuchElementException::new);
        if(!retrievedItem.getHousehold().getId().equals(householdId)){
            throw new IllegalArgumentException("This is not your household");
        } else {
            repository.delete(retrievedItem);
        }
    }

    @Override
    public ItemDto create(Item item, CTMUser user) {
        if(!user.getHousehold().getEnableWishList()){
            throw new IllegalArgumentException("Wish lists has not been enabled for household " + user.getHousehold().getName());
        }
        CTMUser ctmuser = userRepository.findById(user.getId()).orElseThrow(NoSuchElementException::new);
        item.setHousehold(user.getHousehold());
        item.setAssignee(ctmuser);
        return new ItemDto(repository.save(item));
    }
}
