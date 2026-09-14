package com.couple.taskmanager.service;

import com.couple.taskmanager.model.*;
import com.couple.taskmanager.repository.*;
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
    private HouseholdRepository householdRepository;

    @Autowired
    private TravelTemplateItemRepository templateItemRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private CTMUserRepository userRepository;

    @Autowired
    private TripItemRepository tripItemRepository;

    //== Paramètre Foyer ==//
    @Transactional
    public Household enableTravelChecklist(Long householdId, boolean enabled) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new NoSuchElementException("Household not found with id: " + householdId));
        household.setEnableTravelChecklist(enabled);
        return householdRepository.save(household);
    }

    //== Modèle par Défaut (Template) ==//
    public List<TravelTemplateItem> getTemplateItems(Long userId) {
        return templateItemRepository.findByUserId(userId);
    }

    @Transactional
    public TravelTemplateItem addTemplateItem(Long userId, TravelTemplateItem item) {
        CTMUser ctmUser = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + userId));
        item.setUser(ctmUser);
        item.setId(null); // Force l'insertion d'une nouvelle entité
        return templateItemRepository.save(item);
    }

    @Transactional
    public void deleteTemplateItem(Long itemId) {
        if (!templateItemRepository.existsById(itemId)) {
            throw new NoSuchElementException("Template item not found with id: " + itemId);
        }
        templateItemRepository.deleteById(itemId);
    }

    //== Gestion des Voyages ==//
    @Transactional(readOnly = true)
    public List<Trip> getTrips(Long userId) {
        return tripRepository.findByUserIdWithItems(userId);
    }

    @Transactional
    public Trip createTrip(Long userId, String destination, LocalDate departureDate) {
        CTMUser ctmUser = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + userId));
        Trip newTrip = new Trip();
        newTrip.setUser(ctmUser);
        newTrip.setDestination(destination);
        newTrip.setDepartureDate(departureDate);

        // Cloner les articles du modèle vers le nouveau voyage
        List<TravelTemplateItem> templateItems = templateItemRepository.findByUserId(userId);
        List<TripItem> tripItems = templateItems.stream().map(templateItem -> {
            TripItem tripItem = new TripItem();
            tripItem.setName(templateItem.getName());
            tripItem.setCategory(templateItem.getCategory());
            tripItem.setTrip(newTrip);
            tripItem.setIncluded(true);
            tripItem.setPacked(false);
            tripItem.setQuantity(1);
            return tripItem;
        }).collect(Collectors.toList());

        newTrip.setItems(tripItems);
        return tripRepository.save(newTrip);
    }

    @Transactional
    public void deleteTrip(Long tripId) {
        if (!tripRepository.existsById(tripId)) {
            throw new NoSuchElementException("Trip not found with id: " + tripId);
        }
        tripRepository.deleteById(tripId);
    }

    @Transactional
    public TripItem addTripItem(Long tripId, TripItem itemData) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new NoSuchElementException("Trip not found with id: " + tripId));
        itemData.setTrip(trip);
        itemData.setId(null);
        if (itemData.getQuantity() <= 0) {
            itemData.setQuantity(1);
        }
        itemData.setIncluded(true);
        itemData.setPacked(false);
        return tripItemRepository.save(itemData);
    }

    @Transactional
    public void markTripAsCompleted(Long tripId, boolean completed) {
        tripRepository.setTripCompletedEquals(completed);
    }

    @Transactional
    public TripItem updateTripItem(Long itemId, TripItem itemChanges) {
        TripItem existingItem = tripItemRepository.findById(itemId)
                .orElseThrow(() -> new NoSuchElementException("TripItem not found with id: " + itemId));

        // Met à jour la quantité seulement si elle est strictement supérieure à 0
        if (itemChanges.getQuantity() > 0) {
            existingItem.setQuantity(itemChanges.getQuantity());
        }

        // Met à jour l'état emballé
        existingItem.setPacked(itemChanges.isPacked());

        // Met à jour le nom si fourni
        if (itemChanges.getName() != null && !itemChanges.getName().isBlank()) {
            existingItem.setName(itemChanges.getName());
        }

        return tripItemRepository.save(existingItem);
    }

    @Transactional
    public void deleteTripItem(Long itemId) {
        if (!tripItemRepository.existsById(itemId)) {
            throw new NoSuchElementException("TripItem not found with id: " + itemId);
        }
        tripItemRepository.deleteById(itemId);
    }
}