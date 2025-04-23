package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.model.dto.HouseholdDto;
import com.couple.taskmanager.service.HouseholdService;
import com.couple.taskmanager.service.RecipeService;
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
        HouseholdDto memberHousehold = householdService.getMemberHousehold(user);
        System.out.println("Member house hold is " + memberHousehold);
        System.out.println("Member house hold is " + memberHousehold.getMembers());
        System.out.println("Member house hold is " + memberHousehold.getName());
        System.out.println("Member house hold is " + memberHousehold.getHouseholdJoinKey());
        return memberHousehold;
    }

    @PostMapping("/join")
    public HouseholdDto joinHousehold(@RequestBody String joinKey, @AuthenticationPrincipal UserDetails userDetails){
        CTMUser user = (CTMUser) userDetails;
        if(user.getHousehold().getHouseholdJoinKey().equals(joinKey)) throw new IllegalArgumentException();
        return householdService.joinHousehold(joinKey, user);
    }

}
