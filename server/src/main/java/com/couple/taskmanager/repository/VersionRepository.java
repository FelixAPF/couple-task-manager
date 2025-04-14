package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.model.Version;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface VersionRepository extends JpaRepository<Version, Long> {
    @Query("SELECT v.versionNumber FROM Version v ORDER BY v.id DESC LIMIT 1")
    String findLatestVersionNumber();
}
