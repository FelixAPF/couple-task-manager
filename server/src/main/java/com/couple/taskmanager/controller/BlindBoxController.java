package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.dto.blindbox.*;
import com.couple.taskmanager.service.BlindBoxService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/blind-boxes")
@RequiredArgsConstructor
public class BlindBoxController {
    private final BlindBoxService blindBoxService;

    @GetMapping("/my-keys")
    public ResponseEntity<List<UserKeyInventoryDto>> getMyKeys(@AuthenticationPrincipal CTMUser user) {
        return ResponseEntity.ok(blindBoxService.getUserKeys(user));
    }

    @GetMapping("/collections")
    public ResponseEntity<List<CollectionProgressDto>> getCollections(@AuthenticationPrincipal CTMUser user) {
        return ResponseEntity.ok(blindBoxService.getUserCollectionsProgress(user));
    }

    @GetMapping("/collections/{collectionId}/pokedex")
    public ResponseEntity<List<PokedexCardDto>> getPokedex(
            @PathVariable Long collectionId,
            @RequestParam(required = false) Long userId,
            @AuthenticationPrincipal CTMUser user) {
        Long targetId = (userId != null) ? userId : user.getId();
        return ResponseEntity.ok(blindBoxService.getPokedex(collectionId, targetId, user));
    }

    @PostMapping("/open/{boxId}")
    public ResponseEntity<UnboxResultDto> openBox(@PathVariable Long boxId, @AuthenticationPrincipal CTMUser user) {
        return ResponseEntity.ok(blindBoxService.openBox(boxId, user));
    }

    @GetMapping("/inspection-enabled")
    public ResponseEntity<Boolean> isInspectionEnabled() {
        return ResponseEntity.ok(blindBoxService.isPartnerInspectionAllowed());
    }
}