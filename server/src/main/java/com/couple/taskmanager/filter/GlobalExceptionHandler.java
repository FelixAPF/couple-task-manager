package com.couple.taskmanager.exception; // Or a relevant package

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * This method handles all otherwise uncaught exceptions in the application.
     * It prevents exceptions like NullPointerException from becoming a 401 error.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(Exception ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", System.currentTimeMillis());
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("error", "Internal Server Error");
        // WARNING: Exposing raw exception messages in production can be a security risk.
        // Consider a generic message instead for non-development environments.
        body.put("message", ex.getMessage());
        body.put("path", ((ServletWebRequest)request).getRequest().getRequestURI());

        // Return a 500 Internal Server Error response
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}