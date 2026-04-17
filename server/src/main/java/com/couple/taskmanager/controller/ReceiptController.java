package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Receipt;
import com.couple.taskmanager.model.ReceiptItem;
import com.couple.taskmanager.repository.ReceiptRepository;
import com.couple.taskmanager.service.ReceiptParserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/receipts")
public class ReceiptController {

    @Autowired
    private ReceiptRepository receiptRepository;

    @Autowired
    private ReceiptParserService receiptParserService;

    // 1. Keep MULTIPART explicitly for the file upload endpoint
    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> analyzeReceipt(@RequestParam("file") MultipartFile file) {
        try {
            List<ReceiptItem> items = receiptParserService.parseReceiptImage(file);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS)
                        .body("Quota AI dépassé. Veuillez patienter.");
            }
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // 2. Let Spring handle the JSON and charset automatically
    @PostMapping
    public ResponseEntity<Receipt> saveReceipt(@RequestBody Receipt receipt, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        receipt.setHousehold(user.getHousehold());

        if (receipt.getItems() != null) {
            receipt.getItems().forEach(item -> item.setReceipt(receipt));
        }
        return ResponseEntity.ok(receiptRepository.save(receipt));
    }

    // 3. Let Spring handle the JSON and charset automatically
    @PutMapping("/{id}")
    public ResponseEntity<Receipt> updateReceipt(@PathVariable Long id, @RequestBody Receipt receipt, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        receipt.setId(id);
        receipt.setHousehold(user.getHousehold());

        if (receipt.getItems() != null) {
            receipt.getItems().forEach(item -> item.setReceipt(receipt));
        }
        return ResponseEntity.ok(receiptRepository.save(receipt));
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<Receipt>> getMyReceipts(@AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        Long myHouseholdId = user.getHousehold().getId();

        return ResponseEntity.ok(receiptRepository.findByHouseholdId(myHouseholdId));
    }
}