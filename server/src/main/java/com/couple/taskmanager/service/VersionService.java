package com.couple.taskmanager.service;

import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.repository.RecipeRepository;
import com.couple.taskmanager.repository.VersionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class VersionService {
    @Autowired
    VersionRepository repository;

    public String get(){
        return repository.findLatestVersionNumber();
    }
}
