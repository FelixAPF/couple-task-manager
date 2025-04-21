package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.repository.HouseholdRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HouseholdService implements IGenericService<Household> {
    @Autowired
    HouseholdRepository repository;

    @Override
    public Household get(Long id, CTMUser user) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public List<Household> list(CTMUser user) {
        return repository.findAll();
    }

    @Override
    public Household update(Long id, Household household, CTMUser user) {
        throw new IllegalArgumentException();
    }

    @Override
    public void delete(Long id, CTMUser user) {
        repository.deleteById(id);
    }

    @Override
    public Household create(Household household, CTMUser user) {
        return repository.save(household);
    }
}
