package com.couple.taskmanager.service;

import com.couple.taskmanager.model.*;
import com.couple.taskmanager.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

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

    //== Modèle par Défaut ==//
    public List<TravelTemplateItem> getTemplateItems(Long userId) {
        return templateItemRepository.findByUserId(userId);
    }

    @Transactional
    public TravelTemplateItem addTemplateItem(Long userId, TravelTemplateItem item) {
        CTMUser ctmUser = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + userId));
        item.setUser(ctmUser);
        item.setId(null);
        return templateItemRepository.save(item);
    }

    @Transactional
    public void deleteTemplateItem(Long itemId) {
        if (!templateItemRepository.existsById(itemId)) {
            throw new NoSuchElementException("Template item not found with id: " + itemId);
        }
        templateItemRepository.deleteById(itemId);
    }

    @Transactional(readOnly = true)
    public List<Trip> getTrips(Long userId) {
        List<Trip> trips = tripRepository.findByUserIdWithItems(userId);
        for (Trip trip : trips) {
            // Initialise les participants proprement sans produit cartésien
            org.hibernate.Hibernate.initialize(trip.getParticipants());

            // Sécurité supplémentaire : dédoublonnage en mémoire par ID
            if (trip.getItems() != null) {
                java.util.Set<Long> seen = new java.util.HashSet<>();
                trip.setItems(trip.getItems().stream()
                        .filter(item -> item.getId() == null || seen.add(item.getId()))
                        .collect(java.util.stream.Collectors.toList()));
            }
        }
        return trips;
    }

    @Transactional
    public Trip createTrip(Long creatorId, String destination, LocalDate departureDate, List<Long> participantIds) {
        CTMUser creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + creatorId));
        Trip newTrip = new Trip();
        newTrip.setUser(creator);
        newTrip.setDestination(destination);
        newTrip.setDepartureDate(departureDate);

        // Participants
        Set<CTMUser> participants = new HashSet<>();
        if (participantIds != null && !participantIds.isEmpty()) {
            for (Long pId : participantIds) {
                userRepository.findById(pId).ifPresent(participants::add);
            }
        }
        if (participants.isEmpty()) {
            participants.add(creator);
        }
        newTrip.setParticipants(participants);

        // Cloner pour CHAQUE participant son propre modèle de voyage
        List<TripItem> allTripItems = new ArrayList<>();
        for (CTMUser participant : participants) {
            // Charge STRICTEMENT le modèle personnel de ce voyageur
            List<TravelTemplateItem> userTemplate = templateItemRepository.findByUserId(participant.getId());
            for (TravelTemplateItem tItem : userTemplate) {
                TripItem item = new TripItem();
                item.setName(tItem.getName());
                item.setCategory(tItem.getCategory());
                item.setTrip(newTrip);
                item.setUser(participant);
                item.setIncluded(true);
                item.setPacked(false);
                item.setQuantity(1);
                allTripItems.add(item);
            }
        }

        newTrip.setItems(allTripItems);
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
    public TripItem addTripItem(Long tripId, Long userId, TripItem itemData) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new NoSuchElementException("Trip not found with id: " + tripId));
        CTMUser user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + userId));

        itemData.setTrip(trip);
        itemData.setUser(user); // Lié à l'utilisateur qui l'ajoute
        itemData.setId(null);
        if (itemData.getQuantity() <= 0) {
            itemData.setQuantity(1);
        }
        itemData.setIncluded(true);
        itemData.setPacked(false);
        return tripItemRepository.save(itemData);
    }

    @Transactional
    public TripItem updateTripItem(Long itemId, Long currentUserId, TripItem itemChanges) {
        TripItem existingItem = tripItemRepository.findById(itemId)
                .orElseThrow(() -> new NoSuchElementException("TripItem not found with id: " + itemId));

        // Protection : seul le propriétaire peut modifier son article
        if (existingItem.getUser() != null && !existingItem.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Vous ne pouvez pas modifier les affaires d'un autre voyageur.");
        }

        if (itemChanges.getQuantity() > 0) {
            existingItem.setQuantity(itemChanges.getQuantity());
        }
        existingItem.setPacked(itemChanges.isPacked());
        if (itemChanges.getName() != null && !itemChanges.getName().isBlank()) {
            existingItem.setName(itemChanges.getName());
        }
        return tripItemRepository.save(existingItem);
    }

    @Transactional
    public void deleteTripItem(Long itemId, Long currentUserId) {
        TripItem existingItem = tripItemRepository.findById(itemId)
                .orElseThrow(() -> new NoSuchElementException("TripItem not found with id: " + itemId));

        // Protection : seul le propriétaire peut supprimer son article
        if (existingItem.getUser() != null && !existingItem.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Vous ne pouvez pas supprimer les affaires d'un autre voyageur.");
        }
        tripItemRepository.delete(existingItem);
    }
}