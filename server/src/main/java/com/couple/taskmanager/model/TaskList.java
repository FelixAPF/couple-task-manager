package com.couple.taskmanager.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "household_id"})
)
public class TaskList {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    // --- CHANGED THIS SECTION ---
    // We removed 'mappedBy' and gave it a direct JoinTable so Hibernate doesn't crash
    @ManyToMany
    @JoinTable(
            name = "task_tasklist",
            joinColumns = @JoinColumn(name = "tasklist_id"),
            inverseJoinColumns = @JoinColumn(name = "task_id")
    )
    private List<Task> tasks = new ArrayList<>();
    // ----------------------------

    @ManyToOne
    @JoinColumn(name = "user_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonBackReference("user-task-list")
    private CTMUser user;

    @ManyToOne
    @JoinColumn(name = "household_id")
    @JsonBackReference("household-task-lists")
    private Household household;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TaskList taskList = (TaskList) o;
        return id != null && id.equals(taskList.id);
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : Objects.hash(super.hashCode());
    }

    @Override
    public String toString() {
        return "TaskList{" +
                "id=" + id +
                ", userId=" + (user != null ? user.getId() : "null") +
                ", householdId=" + (household != null ? household.getId() : "null") +
                '}';
    }
}