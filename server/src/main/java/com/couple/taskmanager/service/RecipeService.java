package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.model.dto.RecipeDto;
import com.couple.taskmanager.repository.HouseholdRepository;
import com.couple.taskmanager.repository.RecipeRepository;
import com.couple.taskmanager.utils.StreamUtils;
import jakarta.transaction.SystemException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RecipeService implements IGenericService<Recipe, RecipeDto> {
    @Autowired
    RecipeRepository repository;
    @Autowired
    HouseholdRepository householdRepository;

    Map<Long, List<RecipeDto>> recipeDtoMap = new HashMap<>();


    @Override
    public RecipeDto get(Long id, Long householdId, CTMUser user) {
        return repository.findById(id).map(RecipeDto::new).orElseThrow(() -> new NoSuchElementException("No recipe with id " + id + " found"));
    }

    @Override
    public List<RecipeDto> list(Long householdId, CTMUser user) {
        List<RecipeDto> recipeDtos;
        if(recipeDtoMap.containsKey(householdId)){
            recipeDtos = recipeDtoMap.get(householdId);
        } else {
            recipeDtos = repository.findAllByHouseholdId(user.getHousehold().getId()).stream().map(RecipeDto::new).toList();
            recipeDtoMap.put(householdId, recipeDtos);
        }
        return recipeDtos;
    }

    @Override
    public RecipeDto update(Long id, Recipe recipe, CTMUser user) {
        if(!repository.existsById(id)){
            throw new NoSuchElementException("No recipe with id " + id);
        }
        Household household = householdRepository.findById(user.getHousehold().getId()).orElseThrow(() -> new NoSuchElementException("No household with id "));
        recipe.setHousehold(household);

        RecipeDto recipeDto = new RecipeDto(repository.save(recipe));
        synchronizeHouseholdMapData(household.getId());
        return recipeDto;
    }

    @Override
    public void delete(Long id, Long householdId, CTMUser user) {
        Recipe recipeToDelete = repository.findById(id).orElse(null);
        if(recipeToDelete == null || !Objects.equals(householdId, recipeToDelete.getHousehold().getId())){
            throw new IllegalArgumentException("Household is not yours");
        }
        repository.delete(recipeToDelete);
        synchronizeHouseholdMapData(householdId);
    }

    @Override
    public RecipeDto create(Recipe recipe, CTMUser user) {
        if(recipe.getHousehold() == null){
            recipe.setHousehold(user.getHousehold());
        }
        RecipeDto recipeDto = new RecipeDto(repository.save(recipe));
        synchronizeHouseholdMapData(user.getHousehold().getId());
        return recipeDto;
    }


    public List<RecipeDto> create(List<Recipe> recipes, CTMUser user) {
        Household household = householdRepository.findById(user.getHousehold().getId()).orElseThrow(NoSuchElementException::new);
        recipes.forEach(recipe -> {
            if(recipe.getHousehold() == null){
                recipe.setHousehold(household);
            }
        });
        List<RecipeDto> list = repository.saveAll(recipes).stream().map(RecipeDto::new).toList();
        synchronizeHouseholdMapData(user.getHousehold().getId());
        return list;
    }

    public List<RecipeDto> findByRecipeType(String recipeType, CTMUser user) {
        return repository.findByRecipeTypeAndHouseholdId(recipeType, user.getHousehold().getId()).stream().map(RecipeDto::new).toList();
    }

    private void synchronizeHouseholdMapData(Long householdId){
        List<Recipe> allByHouseholdId = repository.findAllByHouseholdId(householdId);
        recipeDtoMap.put(householdId, StreamUtils.mapToList(allByHouseholdId, RecipeDto::new));
    }

    public RecipeDto findRandomRecipe(CTMUser user) throws SystemException {
        Long householdId = user.getHousehold().getId();
        if(householdId == null) throw new SystemException("Household is null");

        long qty = repository.countByHouseholdId(householdId);
        if (qty == 0) {
            throw new NoSuchElementException("No recipes found for this household");
        }

        int idx = (int) (Math.random() * qty);

        PageRequest pageRequest = PageRequest.of(idx, 1);
        List<Recipe> recipes = repository.findByHouseholdId(householdId, pageRequest);

        if (recipes.isEmpty()) {
            throw new NoSuchElementException("Error fetching random recipe");
        }

        return new RecipeDto(recipes.get(0));
    }
}
