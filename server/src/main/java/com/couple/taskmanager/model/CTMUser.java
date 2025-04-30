package com.couple.taskmanager.model;

import com.couple.taskmanager.enums.UserRole;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Date;
import java.util.List;

@Entity
@Data
public class CTMUser implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    // Add other user fields as needed (e.g., name, etc.)
    private String name; // Optional

    @Enumerated(EnumType.STRING) // Added role enum
    private UserRole role;

    private String imageUrl;

    private Date birthDay;

    @ManyToOne
    @JsonBackReference("household-users")
    private Household household;

    @OneToMany(mappedBy = "assignee", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonManagedReference("user-task-assignments")
    private List<TaskAssignment> taskAssignments;

    @OneToMany(mappedBy = "user")
    @JsonManagedReference("user-task-list")
    private List<TaskList> taskLists;

    @OneToMany
    @JsonManagedReference("user-ways-to-care")
    private List<WayToCare> waysToCare;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public String getUsername() {
        return email; // Username is email
    }
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
