package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Meal;
import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.model.dto.MealDateRangeDto;
import com.couple.taskmanager.model.dto.MealDto;
import com.couple.taskmanager.service.MealService;
import com.couple.taskmanager.service.RecipeService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/meals")
public class MealController extends GenericController<Meal, MealDto, MealService> {

    @PostMapping("/by-date-range")
    public List<MealDto> retrieveByDateRange(@RequestBody MealDateRangeDto dateRangeDto, @AuthenticationPrincipal UserDetails userDetails){
        return this.service.retrieveByDateRange(dateRangeDto.getStartDate(), dateRangeDto.getEndDate(), (CTMUser) userDetails);
    }

    @GetMapping("/by-date/{date}")
    public MealDto retrieveMealByDate(@PathVariable("date") Date date, @AuthenticationPrincipal UserDetails userDetails){
        return this.service.retrieveByDate(date, (CTMUser) userDetails);
    }
}
