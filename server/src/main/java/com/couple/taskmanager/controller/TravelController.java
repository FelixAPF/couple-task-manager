package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.TravelTemplateItem;
import com.couple.taskmanager.model.Trip;
import com.couple.taskmanager.model.TripItem;
import com.couple.taskmanager.service.CTMUserService;
import com.couple.taskmanager.service.TravelService;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/households/{householdId}/travel")
public class TravelController {
    @Autowired
    private TravelService travelService;

    @Autowired
    private CTMUserService userService;

    private CTMUser getUser(UserDetails userDetails) {
        if (userDetails instanceof CTMUser ctmUser) {
            return ctmUser;
        }
        return userService.getCurrentUser();
    }

    //== Endpoints du Modèle (Template) ==//
    @GetMapping("/template")
    public ResponseEntity<List<TravelTemplateItem>> getTemplate(
            @PathVariable Long householdId,
            @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = getUser(userDetails);
        return ResponseEntity.ok(travelService.getTemplateItems(user.getId()));
    }

    @PostMapping("/template")
    public ResponseEntity<TravelTemplateItem> addTemplateItem(
            @PathVariable Long householdId,
            @RequestBody TravelTemplateItem item,
            @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = getUser(userDetails);
        return ResponseEntity.ok(travelService.addTemplateItem(user.getId(), item));
    }

    @DeleteMapping("/template/{itemId}")
    public ResponseEntity<Void> deleteTemplateItem(
            @PathVariable Long householdId,
            @PathVariable Long itemId) {
        travelService.deleteTemplateItem(itemId);
        return ResponseEntity.ok().build();
    }

    //== Endpoints des Voyages ==//
    @GetMapping("/trips")
    public ResponseEntity<List<Trip>> getTrips(
            @PathVariable Long householdId,
            @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = getUser(userDetails);
        return ResponseEntity.ok(travelService.getTrips(user.getId()));
    }

    @PostMapping("/trips")
    public ResponseEntity<Trip> createTrip(
            @PathVariable Long householdId,
            @RequestBody CreateTripRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = getUser(userDetails);
        return ResponseEntity.ok(travelService.createTrip(user.getId(), request.getDestination(), request.getDepartureDate()));
    }

    @DeleteMapping("/trips/{tripId}")
    public ResponseEntity<Void> deleteTrip(@PathVariable Long householdId, @PathVariable Long tripId) {
        travelService.deleteTrip(tripId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/trips/{tripId}/items")
    public ResponseEntity<TripItem> addTripItem(@PathVariable Long householdId, @PathVariable Long tripId, @RequestBody TripItem itemData) {
        return ResponseEntity.ok(travelService.addTripItem(tripId, itemData));
    }

    @PutMapping("/trips/{tripId}/items/{itemId}")
    public ResponseEntity<TripItem> updateTripItem(@PathVariable Long householdId, @PathVariable Long tripId, @PathVariable Long itemId, @RequestBody TripItem itemChanges) {
        return ResponseEntity.ok(travelService.updateTripItem(itemId, itemChanges));
    }

    @DeleteMapping("/trips/{tripId}/items/{itemId}")
    public ResponseEntity<Void> deleteTripItem(@PathVariable Long householdId, @PathVariable Long tripId, @PathVariable Long itemId) {
        travelService.deleteTripItem(itemId);
        return ResponseEntity.ok().build();
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateTripRequest {
        private String destination;

        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate departureDate;
    }
}