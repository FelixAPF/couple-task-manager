package com.couple.taskmanager.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum FoodIntakeMealType {
    BREAKFAST("breakfast"),
    LUNCH("lunch"),
    DINNER("dinner"),
    SNACK("snack");

    private final String value;

    FoodIntakeMealType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}