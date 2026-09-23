package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.blindbox.*;
import com.couple.taskmanager.model.dto.blindbox.*;
import com.couple.taskmanager.repository.blindbox.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlindBoxService {
    private final BlindBoxCollectionRepository collectionRepository;
    private final BlindBoxRarityRepository rarityRepository;
    private final BlindBoxItemRepository itemRepository;
    private final BlindBoxRepository boxRepository;
    private final BlindBoxKeyRepository keyRepository;
    private final UserKeyInventoryRepository inventoryRepository;
    private final UserCollectionItemRepository userCollectionRepository;
    private final SystemConfigRepository systemConfigRepository;

    // === SYSTEM SETTINGS ===
    public boolean isPartnerInspectionAllowed() {
        return systemConfigRepository.findByConfigKey("ALLOW_HOUSEHOLD_INSPECTION")
                .map(c -> Boolean.parseBoolean(c.getConfigValue()))
                .orElse(false);
    }

    @Transactional
    public void setPartnerInspectionAllowed(boolean allowed) {
        SystemConfig config = systemConfigRepository.findByConfigKey("ALLOW_HOUSEHOLD_INSPECTION")
                .orElseGet(() -> {
                    SystemConfig c = new SystemConfig();
                    c.setConfigKey("ALLOW_HOUSEHOLD_INSPECTION");
                    return c;
                });
        config.setConfigValue(String.valueOf(allowed));
        systemConfigRepository.save(config);
    }

    // === USER ACTIONS ===
    public List<UserKeyInventoryDto> getUserKeys(CTMUser user) {
        return inventoryRepository.findByUserId(user.getId())
                .stream()
                .filter(inv -> inv.getQuantity() > 0)
                .map(UserKeyInventoryDto::new)
                .collect(Collectors.toList());
    }

    public List<CollectionProgressDto> getUserCollectionsProgress(CTMUser targetUser) {
        List<BlindBoxCollection> activeCollections = collectionRepository.findByActiveTrueOrderByDisplayOrderAsc();
        List<UserCollectionItem> userItems = userCollectionRepository.findByUserId(targetUser.getId());

        Set<Long> ownedItemIds = userItems.stream()
                .map(ui -> ui.getItem().getId())
                .collect(Collectors.toSet());

        return activeCollections.stream().map(col -> {
            long total = col.getItems().size();
            long owned = col.getItems().stream().filter(i -> ownedItemIds.contains(i.getId())).count();
            return new CollectionProgressDto(col, owned, total);
        }).collect(Collectors.toList());
    }

    public List<PokedexCardDto> getPokedex(Long collectionId, Long targetUserId, CTMUser currentUser) {
        if (!currentUser.getId().equals(targetUserId)) {
            if (!isPartnerInspectionAllowed()) {
                throw new AccessDeniedException("L'inspection des collections est désactivée.");
            }
            if (!currentUser.getHousehold().getId().equals(targetUserId)) {
                // Must be in same household
                boolean sameHousehold = currentUser.getHousehold().getUsers().stream()
                        .anyMatch(u -> u.getId().equals(targetUserId));
                if (!sameHousehold) throw new AccessDeniedException("Foyer différent.");
            }
        }

        BlindBoxCollection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new NoSuchElementException("Collection introuvable"));

        List<UserCollectionItem> owned = userCollectionRepository.findByUserIdAndItemCollectionId(targetUserId, collectionId);
        Map<Long, UserCollectionItem> ownedMap = owned.stream()
                .collect(Collectors.toMap(ui -> ui.getItem().getId(), ui -> ui));

        return collection.getItems().stream()
                .sorted(Comparator.comparingInt(BlindBoxItem::getItemNumber))
                .map(item -> {
                    UserCollectionItem userEntry = ownedMap.get(item.getId());
                    return new PokedexCardDto(item, userEntry);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public UnboxResultDto openBox(Long boxId, CTMUser user) {
        BlindBox box = boxRepository.findById(boxId)
                .orElseThrow(() -> new NoSuchElementException("Boîte introuvable"));

        // Find key required for this box
        BlindBoxKey key = keyRepository.findByBlindBoxId(boxId)
                .orElseThrow(() -> new NoSuchElementException("Aucune clé associée à cette boîte"));

        UserKeyInventory inventory = inventoryRepository.findByUserIdAndKeyId(user.getId(), key.getId())
                .orElseThrow(() -> new IllegalStateException("Vous n'avez pas de clé pour cette boîte !"));

        if (inventory.getQuantity() <= 0) {
            throw new IllegalStateException("Vous n'avez pas de clé pour cette boîte !");
        }

        // Deduct 1 key
        inventory.setQuantity(inventory.getQuantity() - 1);
        inventoryRepository.save(inventory);

        // Determine drop
        BlindBoxCollection collection = box.getCollection();
        BlindBoxItem droppedItem = rollItem(collection);

        // Record to User Collection
        Optional<UserCollectionItem> existingOpt = userCollectionRepository.findByUserIdAndItemId(user.getId(), droppedItem.getId());
        UserCollectionItem userItem;
        boolean isNew = false;
        if (existingOpt.isPresent()) {
            userItem = existingOpt.get();
            userItem.setCount(userItem.getCount() + 1);
            userItem.setLastObtainedDate(new Date());
        } else {
            userItem = new UserCollectionItem();
            userItem.setUser(user);
            userItem.setItem(droppedItem);
            userItem.setCount(1);
            userItem.setFirstObtainedDate(new Date());
            userItem.setLastObtainedDate(new Date());
            isNew = true;
        }
        userCollectionRepository.save(userItem);

        return new UnboxResultDto(droppedItem, isNew, userItem.getCount(), inventory.getQuantity());
    }
    @Transactional
    public BlindBoxKey saveKey(BlindBoxKey key) {
        BlindBox box = key.getBlindBox();
        if (box == null) {
            throw new IllegalArgumentException("Le coffre associé est requis.");
        }

        // Validate and retrieve the Collection ID
        Long collectionId = null;
        if (box.getCollection() != null && box.getCollection().getId() != null) {
            collectionId = box.getCollection().getId();
        }

        if (collectionId == null) {
            throw new IllegalArgumentException("Une collection valide doit être associée au coffre.");
        }

        // Fetch the managed collection entity from the database
        BlindBoxCollection col = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new NoSuchElementException("Collection introuvable avec l'ID: "));
        box.setCollection(col);

        // Save the box if it is new, or update existing
        if (box.getId() == null) {
            box = boxRepository.save(box);
        } else {
            BlindBox existingBox = boxRepository.findById(box.getId()).orElse(box);
            existingBox.setName(box.getName());
            existingBox.setDescription(box.getDescription());
            existingBox.setCollection(col);
            box = boxRepository.save(existingBox);
        }

        key.setBlindBox(box);
        return keyRepository.save(key);
    }
    @Transactional
    public BlindBoxItem saveItem(BlindBoxItem item) {
        if (item.getCollection() != null && item.getCollection().getId() != null) {
            BlindBoxCollection col = collectionRepository.findById(item.getCollection().getId())
                    .orElseThrow(() -> new NoSuchElementException("Collection introuvable"));
            item.setCollection(col);
        }
        if (item.getRarity() != null && item.getRarity().getId() != null) {
            BlindBoxRarity rarity = rarityRepository.findById(item.getRarity().getId())
                    .orElseThrow(() -> new NoSuchElementException("Rareté introuvable"));
            item.setRarity(rarity);
        }
        return itemRepository.save(item);
    }

    private BlindBoxItem rollItem(BlindBoxCollection collection) {
        List<BlindBoxItem> allItems = itemRepository.findByCollectionId(collection.getId());
        if (allItems.isEmpty()) {
            throw new IllegalStateException("La collection ne contient aucun item !");
        }

        // Calculate active drop rates per rarity
        List<BlindBoxRarity> rarities = rarityRepository.findAll();
        Map<Long, Double> rates = new HashMap<>();

        Map<Long, Double> overrides = collection.getRateOverrides().stream()
                .collect(Collectors.toMap(o -> o.getRarity().getId(), CollectionRarityRateOverride::getCustomDropRate));

        for (BlindBoxRarity r : rarities) {
            double rate = overrides.getOrDefault(r.getId(), r.getDefaultDropRate());
            rates.put(r.getId(), rate);
        }

        // Group items by rarity
        Map<Long, List<BlindBoxItem>> itemsByRarity = allItems.stream()
                .collect(Collectors.groupingBy(item -> item.getRarity().getId()));

        // Filter out rarities with no items
        double totalWeight = 0.0;
        Map<Long, Double> validRarities = new HashMap<>();
        for (Map.Entry<Long, List<BlindBoxItem>> entry : itemsByRarity.entrySet()) {
            if (!entry.getValue().isEmpty()) {
                double weight = rates.getOrDefault(entry.getKey(), 10.0);
                validRarities.put(entry.getKey(), weight);
                totalWeight += weight;
            }
        }

        // Roll rarity
        double randomRoll = Math.random() * totalWeight;
        double accumulated = 0.0;
        Long chosenRarityId = validRarities.keySet().iterator().next();

        for (Map.Entry<Long, Double> entry : validRarities.entrySet()) {
            accumulated += entry.getValue();
            if (randomRoll <= accumulated) {
                chosenRarityId = entry.getKey();
                break;
            }
        }

        // Roll uniform random item within chosen rarity
        List<BlindBoxItem> pool = itemsByRarity.get(chosenRarityId);
        int itemIndex = (int) (Math.random() * pool.size());
        return pool.get(itemIndex);
    }

    @Transactional
    public void grantKeyToUser(Long userId, Long keyId, int quantity) {
        BlindBoxKey key = keyRepository.findById(keyId).orElseThrow();
        UserKeyInventory inv = inventoryRepository.findByUserIdAndKeyId(userId, keyId)
                .orElseGet(() -> {
                    UserKeyInventory i = new UserKeyInventory();
                    CTMUser u = new CTMUser();
                    u.setId(userId);
                    i.setUser(u);
                    i.setKey(key);
                    i.setQuantity(0);
                    return i;
                });
        inv.setQuantity(inv.getQuantity() + quantity);
        inventoryRepository.save(inv);
    }

    @Transactional
    public void updateItemRarity(Long itemId, Long rarityId) {
        BlindBoxItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Item non trouvé"));
        BlindBoxRarity rarity = rarityRepository.findById(rarityId)
                .orElseThrow(() -> new EntityNotFoundException("Rareté non trouvée"));
        item.setRarity(rarity);
        itemRepository.save(item);
    }
}