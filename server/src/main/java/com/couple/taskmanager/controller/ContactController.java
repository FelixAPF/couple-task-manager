package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Contact;
import com.couple.taskmanager.model.WayToCare;
import com.couple.taskmanager.model.dto.ContactDto;
import com.couple.taskmanager.model.dto.TransactionDto;
import com.couple.taskmanager.model.dto.WayToCareDto;
import com.couple.taskmanager.service.ContactService;
import com.couple.taskmanager.service.WayToCareService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/contacts")
public class ContactController extends GenericController<Contact, ContactDto, ContactService> {
    @PostMapping("/{id}/transactions")
    public ContactDto addTransactionToContact(@PathVariable("id") Long contactId, @RequestBody TransactionDto transaction, @AuthenticationPrincipal UserDetails userDetails) {
        return service.addTransactionToContact(contactId, transaction, (CTMUser) userDetails);
    }
    @PutMapping("/{id}/transactions/{transactionId}")
    public ContactDto updateTransaction(@PathVariable("id") Long contactId, @RequestBody TransactionDto transaction, @AuthenticationPrincipal UserDetails userDetails) {
        return service.updateTransaction(contactId, transaction, (CTMUser) userDetails);
    }

    @DeleteMapping("{id}/transactions/{transactionId}")
    public void deleteTransaction(@PathVariable("transactionId") Long transactionId, @AuthenticationPrincipal UserDetails userDetails) {
        service.deleteTransaction(transactionId, (CTMUser) userDetails);
    }

}
