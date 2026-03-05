package com.couple.taskmanager.service;

import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.model.dto.AdminMetricDto;
import com.couple.taskmanager.repository.HouseholdRepository;
import com.couple.taskmanager.repository.RecipeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final HouseholdRepository householdRepository;
    private final RecipeRepository recipeRepository;

    public AdminService(HouseholdRepository householdRepository, RecipeRepository recipeRepository) {
        this.householdRepository = householdRepository;
        this.recipeRepository = recipeRepository;
    }

    public List<AdminMetricDto> getHouseholdMetrics() {
        List<Household> households = householdRepository.findAll();

        return households.stream().map(household -> {
            AdminMetricDto metric = new AdminMetricDto();
            metric.setHouseholdName(household.getName());

            metric.setNumberOfUsers(household.getUsers() != null ? household.getUsers().size() : 0);

            metric.setNumberOfRecipes(recipeRepository.countByHouseholdId(household.getId()));

            return metric;
        }).collect(Collectors.toList());
    }
}