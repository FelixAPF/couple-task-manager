package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.TravelTemplateItem;
import com.couple.taskmanager.model.Trip;
import com.couple.taskmanager.service.TravelService;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/households/{householdId}/{userId}travel")
public class TravelController {
    @Autowired
    TravelService travelService;

    // Constructor injection

    //== Template Endpoints ==//
    @GetMapping("/template")
    public List<TravelTemplateItem> getTemplate(@PathVariable Long householdId, @PathVariable Long userId) {
        return travelService.getTemplateItems(userId);
    }

    @PostMapping("/template")
    public TravelTemplateItem addTemplateItem(@@PathVariable Long householdId, PathVariable Long userId, @RequestBody TravelTemplateItem item) {
        return travelService.addTemplateItem(userId, item);
    }

    //== Trip Endpoints ==//
    @GetMapping("/trips")
    public List<Trip> getTrips(@PathVariable Long householdId, @PathVariable Long userId) {
        return travelService.getTrips(householdId);
    }

    @PostMapping("/trips")
    public Trip createTrip(@PathVariable Long householdId, @PathVariable Long userId, @RequestBody CreateTripRequest request) {
        return travelService.createTrip(userId, request.getDestination(), request.getDepartureDate());
    }

    // DTO for the request body
    @Getter
    @Setter
    static class CreateTripRequest {
        private String destination;
        private LocalDate departureDate;
        // Getters

    }

}