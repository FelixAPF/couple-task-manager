package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Letter;
import com.couple.taskmanager.model.dto.CreateLetterDto;
import com.couple.taskmanager.repository.CTMUserRepository;
import com.couple.taskmanager.repository.LetterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;

@Service
public class LetterService {

    @Autowired
    private LetterRepository letterRepository;

    @Autowired
    private CTMUserRepository userRepository;

    @Autowired
    private FirebaseMessagingService firebaseMessagingService;

    @Transactional
    public Letter createLetter(CTMUser sender, CreateLetterDto dto) {
        CTMUser receiver = userRepository.findById(dto.getReceiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Letter letter = new Letter();
        letter.setSender(sender);
        letter.setReceiver(receiver);
        letter.setTitle(dto.getTitle());
        letter.setLetterType(dto.getLetterType());
        letter.setDescription(dto.getDescription());
        letter.setCreatedDate(new Date());
        letter.setHasOptions(dto.isHasOptions());
        letter.setReplyRead(false); // Default

        if (dto.isHasOptions()) {
            letter.setOptionsTitle(dto.getOptionsTitle());
            letter.setOptions(dto.getOptions());
        }

        Letter savedLetter = letterRepository.save(letter);

        try {
            firebaseMessagingService.sendNotificationWithNavigation(
                    receiver,
                    "Nouvelle lettre",
                    "Vous avez reçu du courrier " + sender.getName(),
                    "LETTER",
                    savedLetter.getId() // Pass the ID for redirection
            );
        } catch (Exception e) { e.printStackTrace(); }

        // ... in replyToLetter method ...
        try {
            firebaseMessagingService.sendNotificationWithNavigation(
                    sender,
                    "Réponse à un courrier",
                    letter.getReceiver().getName() + " a répondu à: " + letter.getTitle(),
                    "LETTER",
                    letter.getId() // Pass the ID for redirection
            );
        } catch (Exception e) { e.printStackTrace(); }

        return savedLetter;
    }

    public List<Letter> getUnopenedLetters(CTMUser user) {
        // 1. Letters sent TO me that I haven't opened
        List<Letter> newIncoming = letterRepository.findByReceiverAndOpenedFalseOrderByCreatedDateDesc(user);

        // 2. Letters sent BY me that have a reply I haven't read
        List<Letter> newReplies = letterRepository.findBySenderAndRepliedDateIsNotNullAndReplyReadFalse(user);

        // Combine and sort by most recent activity (Created Date or Replied Date)
        List<Letter> allUnopened = new ArrayList<>();
        allUnopened.addAll(newIncoming);
        allUnopened.addAll(newReplies);

        // Sort descending: For incoming use createdDate, for replies use repliedDate
        Collections.sort(allUnopened, (l1, l2) -> {
            Date d1 = l1.getRepliedDate() != null ? l1.getRepliedDate() : l1.getCreatedDate();
            Date d2 = l2.getRepliedDate() != null ? l2.getRepliedDate() : l2.getCreatedDate();
            return d2.compareTo(d1);
        });

        return allUnopened;
    }

    public List<Letter> getOpenedLetters(CTMUser user) {
        // 1. Letters sent TO me that I have opened
        List<Letter> openedIncoming = letterRepository.findByReceiverAndOpenedTrueOrderByCreatedDateDesc(user);

        // 2. Letters sent BY me that have a reply AND I have read the reply
        List<Letter> readReplies = letterRepository.findBySenderAndRepliedDateIsNotNullAndReplyReadTrue(user);

        List<Letter> allOpened = new ArrayList<>();
        allOpened.addAll(openedIncoming);
        allOpened.addAll(readReplies);

        // Sort
        Collections.sort(allOpened, (l1, l2) -> {
            Date d1 = l1.getRepliedDate() != null ? l1.getRepliedDate() : l1.getCreatedDate();
            Date d2 = l2.getRepliedDate() != null ? l2.getRepliedDate() : l2.getCreatedDate();
            return d2.compareTo(d1);
        });

        return allOpened;
    }

    public Letter getLetterDetails(Long id, CTMUser user) {
        Letter letter = letterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Letter not found"));

        boolean isSender = letter.getSender().getId().equals(user.getId());
        boolean isReceiver = letter.getReceiver().getId().equals(user.getId());

        if (!isSender && !isReceiver) {
            throw new RuntimeException("Unauthorized");
        }

        // Case 1: I am the Receiver viewing a new letter -> Mark opened
        if (isReceiver && !letter.isOpened()) {
            letter.setOpened(true);
            letterRepository.save(letter);
        }

        // Case 2: I am the Sender viewing a letter with a reply -> Mark replyRead
        if (isSender && letter.getRepliedDate() != null && !letter.isReplyRead()) {
            letter.setReplyRead(true);
            letterRepository.save(letter);
        }

        return letter;
    }

    @Transactional
    public Letter replyToLetter(Long id, String selectedOption, CTMUser user) {
        Letter letter = letterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Letter not found"));

        if (!letter.getReceiver().getId().equals(user.getId())) {
            throw new RuntimeException("Only the receiver can reply");
        }

        letter.setSelectedOption(selectedOption);
        letter.setRepliedDate(new Date());
        letter.setOpened(true);
        letter.setReplyRead(false); // Ensure this is false so the sender gets the notification in "Unopened"

        Letter saved = letterRepository.save(letter);

        Long senderId = letter.getSender().getId();
        CTMUser sender = userRepository.findById(senderId).orElse(letter.getSender());

        try {
            firebaseMessagingService.sendNotificationToUser(
                    sender,
                    "Réponse à un courrier",
                    user.getName() + " a répondu à: " + letter.getTitle()
            );
        } catch (Exception e) {
            System.err.println("Failed to send notification: " + e.getMessage());
            e.printStackTrace();
        }

        return saved;
    }

    public void deleteLetter(Long id) {
        letterRepository.deleteById(id);
    }
}