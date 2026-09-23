package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.blindbox.*;
import com.couple.taskmanager.repository.blindbox.*;
import com.couple.taskmanager.service.BlindBoxService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/blind-boxes")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class BlindBoxAdminController {
    private final BlindBoxService blindBoxService;
    private final BlindBoxRarityRepository rarityRepository;
    private final BlindBoxCollectionRepository collectionRepository;
    private final BlindBoxItemRepository itemRepository;
    private final BlindBoxRepository boxRepository;
    private final BlindBoxKeyRepository keyRepository;

    // --- RARITIES ---
    @GetMapping("/rarities")
    public ResponseEntity<List<BlindBoxRarity>> getRarities() {
        return ResponseEntity.ok(rarityRepository.findAllByOrderByDisplayOrderAsc());
    }

    @PostMapping("/rarities")
    public ResponseEntity<BlindBoxRarity> saveRarity(@RequestBody BlindBoxRarity rarity) {
        return ResponseEntity.ok(rarityRepository.save(rarity));
    }

    @DeleteMapping("/rarities/{id}")
    public ResponseEntity<Void> deleteRarity(@PathVariable Long id) {
        rarityRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- COLLECTIONS ---
    @GetMapping("/collections")
    public ResponseEntity<List<BlindBoxCollection>> getCollections() {
        return ResponseEntity.ok(collectionRepository.findAllByOrderByDisplayOrderAsc());
    }

    @PostMapping("/collections")
    public ResponseEntity<BlindBoxCollection> saveCollection(@RequestBody BlindBoxCollection collection) {
        return ResponseEntity.ok(collectionRepository.save(collection));
    }

    @DeleteMapping("/collections/{id}")
    public ResponseEntity<Void> deleteCollection(@PathVariable Long id) {
        collectionRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
    // Replace saveItem:
    @PostMapping("/items")
    public ResponseEntity<BlindBoxItem> saveItem(@RequestBody BlindBoxItem item) {
        return ResponseEntity.ok(blindBoxService.saveItem(item));
    }

    // Replace saveKey:
    @PostMapping("/keys")
    public ResponseEntity<BlindBoxKey> saveKey(@RequestBody BlindBoxKey key) {
        return ResponseEntity.ok(blindBoxService.saveKey(key));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        itemRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- BOXES & KEYS ---
    @GetMapping("/keys")
    public ResponseEntity<List<BlindBoxKey>> getKeys() {
        return ResponseEntity.ok(keyRepository.findAll());
    }


    @PostMapping("/grant-key")
    public ResponseEntity<Void> grantKey(@RequestParam Long userId, @RequestParam Long keyId, @RequestParam int quantity) {
        blindBoxService.grantKeyToUser(userId, keyId, quantity);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/settings/inspection")
    public ResponseEntity<Void> toggleInspection(@RequestParam boolean enabled) {
        blindBoxService.setPartnerInspectionAllowed(enabled);
        return ResponseEntity.ok().build();
    }


}