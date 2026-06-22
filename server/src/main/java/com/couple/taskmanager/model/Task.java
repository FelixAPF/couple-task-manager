package com.couple.taskmanager.model;

import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.enums.Room;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NonNull
    private String title;

    @NonNull
    private String description;

    @NonNull
    private Frequency frequency;

    @NonNull
    private Room room;

    // NEW FIELDS FOR ROLLING LOGIC
    private Date startDate;
    private Date dueDate;

    @Column(columnDefinition="BOOLEAN DEFAULT false")
    @NonNull
    private boolean isNotified;

    @Column(columnDefinition="BOOLEAN DEFAULT false")
    @NonNull
    private boolean doNotify;

    @ManyToOne
    @JoinColumn(name = "assignee_id")
    @JsonBackReference("user-assigned-tasks")
    private CTMUser assignee; // Null means unassigned (household pool)

    @ManyToOne
    @JsonBackReference("household-tasks")
    private Household household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "procedure_id")
    private Procedure procedure;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Task task = (Task) o;
        return id != null && id.equals(task.id);
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 31;
    }
}