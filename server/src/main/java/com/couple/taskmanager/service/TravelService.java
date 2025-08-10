package com.couple.taskmanager.service;

import com.couple.taskmanager.model.*;
import com.couple.taskmanager.repository.CTMUserRepository;
import com.couple.taskmanager.repository.HouseholdRepository;
import com.couple.taskmanager.repository.TravelTemplateItemRepository;
import com.couple.taskmanager.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class TravelService {

    @Autowired
    HouseholdRepository householdRepository;
    @Autowired
    TravelTemplateItemRepository templateItemRepository;
    @Autowired
    TripRepository tripRepository;
    @Autowired
    CTMUserRepository userRepository;

    // Constructor injection

    //== Household Setting ==//
    @Transactional
    public Household enableTravelChecklist(Long householdId, boolean enabled) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new RuntimeException("Household not found"));
        household.setEnableTravelChecklist(enabled);
        return householdRepository.save(household);
    }

    //== Template Methods ==//
    public List<TravelTemplateItem> getTemplateItems(Long userId) {
        return templateItemRepository.findByUserId(userId);
    }

    @Transactional
    public TravelTemplateItem addTemplateItem(Long userId, TravelTemplateItem item) {
        CTMUser ctmUser = userRepository.findById(userId).orElseThrow(NoSuchElementException::new);
        item.setUser(ctmUser);
        return templateItemRepository.save(item);
    }

    //== Trip Methods ==//
    public List<Trip> getTrips(Long userId) {
        return tripRepository.findByUserIdOrderByDepartureDateDesc(userId);
    }

    @Transactional
    public Trip createTrip(Long userId, String destination, LocalDate departureDate) {
        CTMUser ctmUser = userRepository.findById(userId).orElseThrow(NoSuchElementException::new);

        Trip newTrip = new Trip();
        newTrip.setUser(ctmUser);
        newTrip.setDestination(destination);
        newTrip.setDepartureDate(departureDate);

        // Load items from the household's template
        List<TravelTemplateItem> templateItems = templateItemRepository.findByUserId(userId);
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