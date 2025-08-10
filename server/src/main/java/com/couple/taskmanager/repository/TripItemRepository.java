package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.Trip;
import com.couple.taskmanager.model.TripItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TripItemRepository extends JpaRepository<TripItem, Long> {

}