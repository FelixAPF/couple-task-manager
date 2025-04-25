package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.model.dto.HouseholdDto;
import com.couple.taskmanager.model.dto.UpdateHouseholdSettingsDto;
import com.couple.taskmanager.service.HouseholdService;
import com.couple.taskmanager.service.RecipeService;
import jakarta.transaction.SystemException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/household")
public class HouseholdController {
    @Autowired
    HouseholdService householdService;

    @GetMapping
    public HouseholdDto getHousehold(@AuthenticationPrincipal UserDetails userDetails){
        CTMUser user = (CTMUser)userDetails;
        return householdService.getMemberHousehold(user);
    }

    @PostMapping("/join")
    public HouseholdDto joinHousehold(@RequestBody String joinKey, @AuthenticationPrincipal UserDetails userDetails){
        CTMUser user = (CTMUser) userDetails;
        if(user.getHousehold().getHouseholdJoinKey().equals(joinKey)) throw new IllegalArgumentException();
        return householdService.joinHousehold(joinKey, user);
    }

    @PutMapping("/settings")
    public HouseholdDto updateHouseholdSettings(@RequestBody UpdateHouseholdSettingsDto updateHouseholdSettingsDto, @AuthenticationPrincipal UserDetails userDetails) throws SystemException {
        CTMUser user = (CTMUser) userDetails;
        return householdService.updateHouseholdSettings(updateHouseholdSettingsDto, user);
    }

}
