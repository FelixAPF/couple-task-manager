package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Letter;
import com.couple.taskmanager.model.dto.CreateLetterDto;
import com.couple.taskmanager.model.dto.ReplyLetterDto;
import com.couple.taskmanager.service.CTMUserService;
import com.couple.taskmanager.service.LetterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/letters")
public class LetterController {

    @Autowired
    private LetterService letterService;

    @Autowired
    private CTMUserService userService;

    @PostMapping
    public ResponseEntity<Letter> createLetter(@RequestBody CreateLetterDto dto) {
        CTMUser currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(letterService.createLetter(currentUser, dto));
    }

    @GetMapping("/unopened")
    public ResponseEntity<List<Letter>> getUnopened() {
        return ResponseEntity.ok(letterService.getUnopenedLetters(userService.getCurrentUser()));
    }

    @GetMapping("/opened")
    public ResponseEntity<List<Letter>> getOpened() {
        return ResponseEntity.ok(letterService.getOpenedLetters(userService.getCurrentUser()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Letter> getLetter(@PathVariable Long id) {
        return ResponseEntity.ok(letterService.getLetterDetails(id, userService.getCurrentUser()));
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<Letter> reply(@PathVariable Long id, @RequestBody ReplyLetterDto dto) {
        return ResponseEntity.ok(letterService.replyToLetter(id, dto.getSelectedOption(), userService.getCurrentUser()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        letterService.deleteLetter(id);
        return ResponseEntity.ok().build();
    }
}