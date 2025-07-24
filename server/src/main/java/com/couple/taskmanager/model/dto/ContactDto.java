package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.Contact;
import com.couple.taskmanager.utils.StreamUtils;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContactDto {
    private Long id;
    private String name;
    private String phoneNumber;
    private String contactType;
    private String email;
    private String note;

    private List<TransactionDto> transactions;

    public ContactDto(Contact contact) {
        this.id = contact.getId();
        this.name = contact.getName();
        this.phoneNumber = contact.getPhoneNumber();
        this.email = contact.getEmail();
        this.contactType = contact.getContactType();
        this.note = contact.getNote();
        this.transactions = StreamUtils.mapToList(contact.getTransactions(), TransactionDto::new);

    }
}
