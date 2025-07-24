package com.couple.taskmanager.service;

import com.couple.taskmanager.model.*;
import com.couple.taskmanager.model.dto.ContactDto;
import com.couple.taskmanager.model.dto.TransactionDto;
import com.couple.taskmanager.model.dto.WayToCareDto;
import com.couple.taskmanager.repository.*;
import com.couple.taskmanager.utils.StreamUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class ContactService implements IGenericService<Contact, ContactDto>{
    @Autowired
    ContactRepository repository;
    @Autowired
    HouseholdRepository householdRepository;
    @Autowired
    TransactionRepository transactionRepository;


    @Override
    public ContactDto get(Long id, Long householdId, CTMUser user) {
        Contact contact = repository.findById(id).orElseThrow(NoSuchElementException::new);
        if(!contact.getHousehold().getId().equals(householdId)) {
            throw new IllegalArgumentException("This is not your household");
        }
        return new ContactDto(contact);
    }

    @Override
    public List<ContactDto> list(Long householdId, CTMUser user) {
        return repository.findAllByHouseholdId(householdId).stream().map(ContactDto::new).toList();
    }

    @Override
    public ContactDto update(Long id, Contact contact, CTMUser user) {
        Contact contact1 = repository.findById(id).orElseThrow(NoSuchElementException::new);
        if(!contact1.getHousehold().getId().equals(user.getHousehold().getId())) {
            throw new IllegalArgumentException("This is not your household");
        }
        if(contact.getName().isEmpty()) throw new IllegalArgumentException("Name cannot be empty");
        contact1.setName(contact.getName());
        contact1.setNote(contact.getNote());
        contact1.setContactType(contact.getContactType());
        contact1.setPhoneNumber(contact.getPhoneNumber());
        contact1.setEmail(contact.getEmail());
        Contact save = repository.save(contact1);

        return new ContactDto(save);
    }

    @Override
    public void delete(Long id, Long householdId, CTMUser user) {
        Contact contact = repository.findById(id).orElseThrow(NoSuchElementException::new);
        if(!contact.getHousehold().getId().equals(householdId)) {
            throw new IllegalArgumentException("This is not your household");
        }
        repository.delete(contact);
    }

    @Override
    public ContactDto create(Contact contact, CTMUser user) {
        Household household = householdRepository.findById(user.getHousehold().getId()).orElseThrow(NoSuchElementException::new);
        contact.setHousehold(household);
        Contact save = repository.save(contact);
        return new ContactDto(save);
    }

    public ContactDto addTransactionToContact(Long contactId, TransactionDto transaction, CTMUser userDetails) {

        Contact contact = repository.findById(contactId).orElseThrow(NoSuchElementException::new);
        if(!contact.getHousehold().getId().equals(userDetails.getHousehold().getId())) {
            throw new IllegalArgumentException("This is not your household");
        }
        Transaction newTransaction = new Transaction();
        newTransaction.setAmount(transaction.getAmount());
        newTransaction.setDate(transaction.getDate());
        newTransaction.setDescription(transaction.getDescription());
        newTransaction.setNote(transaction.getNote());
        newTransaction.setHousehold(contact.getHousehold());
        Transaction save = transactionRepository.save(newTransaction);
        contact.getTransactions().add(save);
        repository.save(contact);
        return new ContactDto(contact);
    }

    public ContactDto updateTransaction(Long contactId, TransactionDto transaction, CTMUser userDetails) {
        Transaction transaction1 = transactionRepository.findById(transaction.getId()).orElseThrow(NoSuchElementException::new);
        transaction1.setAmount(transaction.getAmount());
        transaction1.setDate(transaction.getDate());
        transaction1.setDescription(transaction.getDescription());
        transaction1.setNote(transaction.getNote());
        transactionRepository.save(transaction1);
        return new ContactDto(repository.findById(contactId).orElseThrow(NoSuchElementException::new));
    }

    public void deleteTransaction(Long transactionId, CTMUser userDetails) {
        Transaction transaction = transactionRepository.findById(transactionId).orElseThrow(IllegalArgumentException::new);
        transactionRepository.delete(transaction);
    }
}
