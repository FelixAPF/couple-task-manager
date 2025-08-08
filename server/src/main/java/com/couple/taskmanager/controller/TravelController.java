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
@RequestMapping("/api/households/{householdId}/travel")
public class TravelController {
    @Autowired
    TravelService travelService;

    // Constructor injection

    //== Template Endpoints ==//
    @GetMapping("/template")
    public ResponseEntity<List<TravelTemplateItem>> getTemplate(@PathVariable Long householdId) {
        return ResponseEntity.ok(travelService.getTemplateItems(householdId));
    }

    @PostMapping("/template")
    public ResponseEntity<TravelTemplateItem> addTemplateItem(@PathVariable Long householdId, @RequestBody TravelTemplateItem item) {
        return ResponseEntity.ok(travelService.addTemplateItem(householdId, item));
    }

    //== Trip Endpoints ==//
    @GetMapping("/trips")
    public ResponseEntity<List<Trip>> getTrips(@PathVariable Long householdId) {
        return ResponseEntity.ok(travelService.getTrips(householdId));
    }

    @PostMapping("/trips")
    public ResponseEntity<Trip> createTrip(@PathVariable Long householdId, @RequestBody CreateTripRequest request) {
        return ResponseEntity.ok(travelService.createTrip(householdId, request.getDestination(), request.getDepartureDate()));
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