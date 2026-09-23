package com.couple.taskmanager.repository.blindbox;

import com.couple.taskmanager.model.blindbox.BlindBoxCollection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlindBoxCollectionRepository extends JpaRepository<BlindBoxCollection, Long> {
    List<BlindBoxCollection> findByActiveTrueOrderByDisplayOrderAsc();
    List<BlindBoxCollection> findAllByOrderByDisplayOrderAsc();
}