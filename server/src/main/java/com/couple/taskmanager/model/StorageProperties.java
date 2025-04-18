package com.couple.taskmanager.model;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("storage")
public class StorageProperties {

    /**
     * Folder location for storing files
     */
    private String location = "/data/uploads"; // Adjust path as needed

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

}