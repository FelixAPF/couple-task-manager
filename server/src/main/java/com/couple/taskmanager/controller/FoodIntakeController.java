package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.dto.FoodIntakeUnitDto;
import com.couple.taskmanager.service.FoodIntakeService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/food-intake")
public class FoodIntakeController {

    private final FoodIntakeService foodIntakeService;

    public FoodIntakeController(FoodIntakeService foodIntakeService) {
        this.foodIntakeService = foodIntakeService;
    }

    @GetMapping
    public ResponseEntity<List<FoodIntakeUnitDto>> getIntakeUnits(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(foodIntakeService.getIntakeUnitsForDateRange(startDate, endDate));
    }

    @PostMapping
    public ResponseEntity<FoodIntakeUnitDto> createIntakeUnit(@RequestBody FoodIntakeUnitDto dto) {
        return ResponseEntity.ok(foodIntakeService.saveIntakeUnit(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FoodIntakeUnitDto> updateIntakeUnit(@PathVariable Long id, @RequestBody FoodIntakeUnitDto dto) {
        dto.setId(id);
        return ResponseEntity.ok(foodIntakeService.saveIntakeUnit(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIntakeUnit(@PathVariable Long id) {
        foodIntakeService.deleteIntakeUnit(id);
        return ResponseEntity.ok().build();
    }
}