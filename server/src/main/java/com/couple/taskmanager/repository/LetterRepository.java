package com.couple.taskmanager.repository;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Letter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LetterRepository extends JpaRepository<Letter, Long> {
    // Letters I received that I haven't opened yet
    List<Letter> findByReceiverAndOpenedFalseOrderByCreatedDateDesc(CTMUser receiver);

    // Letters I received that I HAVE opened
    List<Letter> findByReceiverAndOpenedTrueOrderByCreatedDateDesc(CTMUser receiver);

    // *** NEW: Letters I SENT, that have a reply, but I haven't read the reply yet ***
    List<Letter> findBySenderAndRepliedDateIsNotNullAndReplyReadFalse(CTMUser sender);

    // *** NEW: Letters I SENT that have a reply that I HAVE read (for history) ***
    List<Letter> findBySenderAndRepliedDateIsNotNullAndReplyReadTrue(CTMUser sender);

    // Generic list of sent letters
    List<Letter> findBySenderOrderByCreatedDateDesc(CTMUser sender);
}