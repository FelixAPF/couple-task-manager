package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.model.Transaction;
import com.couple.taskmanager.utils.StreamUtils;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TransactionDto {
    private Long id;
    private String description;
    private Date date;
    private Double amount;
    private String note;

    public TransactionDto(Transaction transaction) {
        this.id = transaction.getId();
        this.description = transaction.getDescription();
        this.date = transaction.getDate();
        this.amount = transaction.getAmount();
        this.note = transaction.getNote();
    }
}
