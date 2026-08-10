package com.couple.taskmanager.model.dto;

import com.couple.taskmanager.model.ReceiptItem;
import lombok.Data;
import java.util.List;

@Data
public class ParsedReceiptDto {
    private String storeName;
    private List<ReceiptItem> items;
}