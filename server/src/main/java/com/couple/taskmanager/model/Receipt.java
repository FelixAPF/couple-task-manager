package com.couple.taskmanager.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Data
public class Receipt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Date date;
    private String storeName;
    private Double groceryTotal;

    // 1. NEW: Store the Draft/Completed status
    private String status;

    // 2. NEW: Store the calculated totals in a connected database table
    @ElementCollection
    @CollectionTable(name = "receipt_totals", joinColumns = @JoinColumn(name = "receipt_id"))
    @MapKeyColumn(name = "total_key")
    @Column(name = "total_value")
    private Map<String, Double> totals = new HashMap<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id")
    @JsonIgnore // <--- ADD THIS LINE
    private Household household;

    @OneToMany(mappedBy = "receipt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReceiptItem> items;

}