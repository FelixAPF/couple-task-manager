package com.couple.taskmanager.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Entity
@Data
public class Household {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "household", fetch = FetchType.EAGER, cascade = {CascadeType.PERSIST, CascadeType.MERGE}) // Changed to EAGER
    @JsonManagedReference("household-users")
    private List<CTMUser> users;

    private String name;

    private String householdJoinKey;

    private Date createdDated;

    private Boolean enableWaysToCare = false;

    private Boolean enableToDoList = false;

    private Boolean enableWishList = false;

    private Boolean enableTravelChecklist = false;

    @OneToMany
    @JsonManagedReference("household-way-to-care")
    private List<WayToCare> waysToCare;
    @OneToMany
    @JsonManagedReference("household-wish-list")
    private List<Item> items;

    @OneToMany
    @JsonManagedReference("household-to-do-items")
    private List<ToDoItem> toDoItems;


    @OneToMany
    @JsonManagedReference("household-recipes")
    private List<Recipe> recipes;

    @OneToMany
    @JsonManagedReference("household-meals")
    private List<Meal> meals;

    @OneToMany
    @JsonManagedReference("household-task-lists")
    private List<TaskList> taskLists;

    @OneToMany
    @JsonManagedReference("household-task-periods")
    private List<TaskPeriod> taskPeriods;

    @OneToMany
    @JsonManagedReference("household-task-list-occasion")
    private List<TaskListOccasion> taskListOccasions;

    @OneToMany
    @JsonManagedReference("household-tasks")
    private List<Task> tasks;

    @OneToMany
    @JsonManagedReference("household-task-assignments")
    private List<TaskAssignment> taskAssignments;

    @OneToMany
    @JsonManagedReference("household-shopping-items")
    private List<ShoppingItem> shoppingItems;

}
