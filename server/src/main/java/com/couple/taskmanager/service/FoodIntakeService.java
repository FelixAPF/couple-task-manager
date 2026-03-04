package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.FoodIntakeUnit;
import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.model.dto.FoodIntakeUnitDto;
import com.couple.taskmanager.repository.CTMUserRepository;
import com.couple.taskmanager.repository.FoodIntakeUnitRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class FoodIntakeService {

    private final FoodIntakeUnitRepository foodIntakeRepository;
    private final CTMUserRepository userRepository;
    private final CTMUserService userService;

    public FoodIntakeService(FoodIntakeUnitRepository foodIntakeRepository,
                             CTMUserRepository userRepository,
                             CTMUserService userService) {
        this.foodIntakeRepository = foodIntakeRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    public List<FoodIntakeUnitDto> getIntakeUnitsForDateRange(LocalDate startDate, LocalDate endDate) {
        Household household = userService.getCurrentUser().getHousehold();
        return foodIntakeRepository.findByHouseholdIdAndDateBetween(household.getId(), startDate, endDate)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public FoodIntakeUnitDto saveIntakeUnit(FoodIntakeUnitDto dto) {
        Household household = userService.getCurrentUser().getHousehold();

        FoodIntakeUnit unit;
        if (dto.getId() != null) {
            unit = foodIntakeRepository.findById(dto.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Intake unit not found"));

            if (!unit.getHousehold().getId().equals(household.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to edit this unit");
            }
        } else {
            unit = new FoodIntakeUnit();
            unit.setHousehold(household);
        }

        CTMUser assignee = userRepository.findById(dto.getAssigneeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignee not found"));

        unit.setDate(dto.getDate());
        unit.setAssignee(assignee);
        unit.setDescription(dto.getDescription());
        unit.setMealType(dto.getMealType());
        unit.setProteinPortion(dto.getProteinPortion());
        unit.setVegetablePortion(dto.getVegetablePortion());
        unit.setCarbohydratePortion(dto.getCarbohydratePortion());
        unit.setFatPortion(dto.getFatPortion());
        unit.setImageUrl(dto.getImageUrl());

        return mapToDto(foodIntakeRepository.save(unit));
    }

    public void deleteIntakeUnit(Long id) {
        Household household = userService.getCurrentUser().getHousehold();
        FoodIntakeUnit unit = foodIntakeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Intake unit not found"));

        if (!unit.getHousehold().getId().equals(household.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to delete this unit");
        }

        foodIntakeRepository.delete(unit);
    }

    private FoodIntakeUnitDto mapToDto(FoodIntakeUnit entity) {
        FoodIntakeUnitDto dto = new FoodIntakeUnitDto();
        dto.setId(entity.getId());
        dto.setDate(entity.getDate());
        dto.setAssigneeId(entity.getAssignee().getId());
        dto.setDescription(entity.getDescription());
        dto.setMealType(entity.getMealType());
        dto.setProteinPortion(entity.getProteinPortion());
        dto.setVegetablePortion(entity.getVegetablePortion());
        dto.setCarbohydratePortion(entity.getCarbohydratePortion());
        dto.setFatPortion(entity.getFatPortion());
        dto.setImageUrl(entity.getImageUrl());
        return dto;
    }
}