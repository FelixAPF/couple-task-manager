package com.couple.taskmanager.service;

import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.model.TravelTemplateItem;
import com.couple.taskmanager.model.Trip;
import com.couple.taskmanager.model.TripItem;
import com.couple.taskmanager.repository.HouseholdRepository;
import com.couple.taskmanager.repository.TravelTemplateItemRepository;
import com.couple.taskmanager.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TravelService {

    @Autowired
    HouseholdRepository householdRepository;
    @Autowired
    TravelTemplateItemRepository templateItemRepository;
    @Autowired
    TripRepository tripRepository;

    // Constructor injection

    //== Household Setting ==//
    @Transactional
    public Household enableTravelChecklist(Long householdId, boolean enabled) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new RuntimeException("Household not found"));
        household.setTravelChecklistEnabled(enabled);
        return householdRepository.save(household);
    }

    //== Template Methods ==//
    public List<TravelTemplateItem> getTemplateItems(Long householdId) {
        return templateItemRepository.findByHouseholdId(householdId);
    }

    @Transactional
    public TravelTemplateItem addTemplateItem(Long householdId, TravelTemplateItem item) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new RuntimeException("Household not found"));
        item.setHousehold(household);
        return templateItemRepository.save(item);
    }

    //== Trip Methods ==//
    public List<Trip> getTrips(Long householdId) {
        return tripRepository.findByHouseholdIdOrderByDepartureDateDesc(householdId);
    }

    @Transactional
    public Trip createTrip(Long householdId, String destination, LocalDate departureDate) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new RuntimeException("Household not found"));

        Trip newTrip = new Trip();
        newTrip.setHousehold(household);
        newTrip.setDestination(destination);
        newTrip.setDepartureDate(departureDate);

        // Load items from the household's template
        List<TravelTemplateItem> templateItems = templateItemRepository.findByHouseholdId(householdId);
        List<TripItem> tripItems = templateItems.stream().map(templateItem -> {
            TripItem tripItem = new TripItem();
            tripItem.setName(templateItem.getName());
            tripItem.setCategory(templateItem.getCategory());
            tripItem.setTrip(newTrip);
            // Default values
            tripItem.setIncluded(true);
            tripItem.setPacked(false);
            tripItem.setQuantity(1);
            return tripItem;
        }).collect(Collectors.toList());

        newTrip.setItems(tripItems);
        return tripRepository.save(newTrip);
    }

    // Add other methods for updating/deleting trips and trip items as needed
}