package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.TravelTemplateItem;
import com.couple.taskmanager.model.Trip;
import com.couple.taskmanager.model.TripItem;
import com.couple.taskmanager.service.TravelService;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    public List<TravelTemplateItem> getTemplate(@PathVariable Long householdId, @AuthenticationPrincipal CTMUser user) {
        return travelService.getTemplateItems(user.getId());
    }

    @PostMapping("/template")
    public TravelTemplateItem addTemplateItem(@PathVariable Long householdId, @RequestBody TravelTemplateItem item, @AuthenticationPrincipal CTMUser user) {
        return travelService.addTemplateItem(user.getId(), item);
    }

    //== Trip Endpoints ==//
    @GetMapping("/trips")
    public List<Trip> getTrips(@PathVariable Long householdId, @AuthenticationPrincipal CTMUser user) {
        return travelService.getTrips(user.getId());
    }

    @DeleteMapping("/trips/{tripId}")
    public void deleteTrip(@PathVariable Long tripId) {
        travelService.deleteTrip(tripId);
    }

    @DeleteMapping("/trips/{tripId}/items/{itemId}")
    public void deleteTripItem(@PathVariable Long tripId, @PathVariable Long itemId) {
        travelService.deleteTripItem(itemId);
    }


    @PostMapping("/trips")
    public Trip createTrip(@PathVariable Long householdId, @RequestBody CreateTripRequest request, @AuthenticationPrincipal CTMUser user) {
        return travelService.createTrip(user.getId(), request.getDestination(), request.getDepartureDate());
    }

    /**
     * POST /api/travel/trips/{tripId}/items
     * Adds a new item to the specified trip's checklist.
     */
    @PostMapping("/trips/{tripId}/items")
    public TripItem addTripItem(@PathVariable Long tripId, @RequestBody TripItem itemData) {
        return travelService.addTripItem(tripId, itemData);
    }

    /**
     * PUT /api/travel/trips/{tripId}/items/{itemId}
     * Updates an existing item in a checklist.
     */
    @PutMapping("/trips/{tripId}/items/{itemId}")
    public TripItem updateTripItem(@PathVariable Long tripId, @PathVariable Long itemId, @RequestBody TripItem itemChanges) {
        // The tripId is in the path for semantic clarity but not strictly needed by the service method
        return travelService.updateTripItem(itemId, itemChanges);
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