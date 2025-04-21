package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.Meal;
import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.model.dto.MealDateRangeDto;
import com.couple.taskmanager.service.MealService;
import com.couple.taskmanager.service.RecipeService;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/meals")
public class MealController extends GenericController<Meal, MealService> {

    @PostMapping("/by-date-range")
    public List<Meal> retrieveByDateRange(@RequestBody MealDateRangeDto dateRangeDto){
        return this.service.retrieveByDateRange(dateRangeDto.getStartDate(), dateRangeDto.getEndDate());
    }

    @GetMapping("/by-date/{date}")
    public Meal retrieveMealByDate(@PathVariable("date") Date date){
        return this.service.retrieveByDate(date);
    }
}
