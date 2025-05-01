package com.couple.taskmanager.model;

import com.couple.taskmanager.enums.Frequency;
import com.couple.taskmanager.enums.Room;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

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

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL)
    @JsonManagedReference("task-task-assignments")
    private List<TaskAssignment> taskAssignments;

    @ManyToMany(cascade = { CascadeType.PERSIST, CascadeType.MERGE })
    @JoinTable(
            name = "task_tasklist",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name= "tasklist_id")
    )
    private List<TaskList> taskLists = new ArrayList<>();

    @NonNull
    private Room room;

    @ManyToOne
    @JsonBackReference("household-tasks")
    private Household household;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Task task = (Task) o;
        // Use ID for equality check, but handle null IDs (transient entities)
        // If both IDs are null, they are not equal unless they are the same instance (checked above)
        // If one ID is null, they are not equal.
        // If both IDs are non-null, compare them.
        return id != null && id.equals(task.id);
    }

    @Override
    public int hashCode() {
        // Use ID for hash code. If ID is null (transient entity), use Object's default hash code.
        // Using a constant like 31 for transient entities is also common.
        return id != null ? id.hashCode() : Objects.hash(super.hashCode());
        // Alternative for transient: return 31;
    }

    // Optional: Add toString manually if needed, excluding collections
    @Override
    public String toString() {
        return "Task{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", frequency=" + frequency +
                ", room=" + room +
                // Avoid printing collections or complex objects here to prevent SOE
                '}';
    }

}
