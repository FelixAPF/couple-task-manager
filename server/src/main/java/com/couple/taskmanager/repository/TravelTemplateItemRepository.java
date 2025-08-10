package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.TravelTemplateItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TravelTemplateItemRepository extends JpaRepository<TravelTemplateItem, Long> {
    List<TravelTemplateItem> findByUserId(Long userId);

}