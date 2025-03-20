package com.couple.taskmanager.config;

import com.couple.taskmanager.enums.Assignee;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import java.io.IOException;

public class AssigneeDeserializer extends JsonDeserializer<Assignee> {

    @Override
    public Assignee deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getText();
        try {
            return Assignee.valueOf(value);
        } catch (IllegalArgumentException e) {
            // Handle invalid enum values (e.g., throw an exception or return a default value)
            return null;
        }
    }
}