package com.couple.taskmanager.model.finance;

import com.couple.taskmanager.model.CTMUser;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;

import java.time.LocalDate;
import java.util.Date;

@Data
@Entity
@Table(name = "paycheck_configs")
public class PaycheckConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private CTMUser user;

    @Column(nullable = false)
    private String cycle;

    @Column(nullable = false)
    private Double amount;

    private String defaultBankAccountId;

    @Column(name = "reference_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate referenceDate;

    @Column(name = "last_actioned_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate lastActionedDate;
}