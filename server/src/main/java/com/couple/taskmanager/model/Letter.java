package com.couple.taskmanager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.Date;
import java.util.List;

@Entity
@Data
public class Letter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    // "Type of letter" (free text)
    private String letterType;

    @Column(length = 4096)
    private String description;

    @ManyToOne
    @JoinColumn(name = "sender_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonIgnoreProperties({"password", "taskAssignments", "taskAssigns", "assignedMeal", "taskLists", "waysToCare", "wishList", "trips", "travelTemplateItems", "household"})
    private CTMUser sender;

    @ManyToOne
    @JoinColumn(name = "receiver_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonIgnoreProperties({"password", "taskAssignments", "taskAssigns", "assignedMeal", "taskLists", "waysToCare", "wishList", "trips", "travelTemplateItems", "household"})
    private CTMUser receiver;

    private boolean opened = false;

    // *** NEW FIELD: Tracks if the original sender has read the reply ***
    private boolean replyRead = false;

    private Date createdDate;
    private Date repliedDate;

    // Options feature
    private boolean hasOptions = false;
    private String optionsTitle;

    @ElementCollection
    @CollectionTable(name = "letter_options", joinColumns = @JoinColumn(name = "letter_id"))
    @Column(name = "option_text")
    private List<String> options;

    private String selectedOption;
}