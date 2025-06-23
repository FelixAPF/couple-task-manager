package com.couple.taskmanager.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.ExpiredJwtException; // Assuming you're using io.jsonwebtoken for JWTs
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {

        // Determine the specific error to provide a more descriptive message
        String errorMessage;
        if (authException.getCause() instanceof ExpiredJwtException) {
            errorMessage = "JWT token has expired.";
        } else if (authException.getCause() != null) {
            errorMessage = "Authentication failed: " + authException.getCause().getMessage();
        } else {
            errorMessage = "Authentication failed: " + authException.getMessage();
        }

        // Set the HTTP status to 401 Unauthorized
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        // Construct a custom JSON error response
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("timestamp", System.currentTimeMillis());
        errorDetails.put("status", HttpServletResponse.SC_UNAUTHORIZED);
        errorDetails.put("error", "Unauthorized");
        errorDetails.put("message", errorMessage);
        errorDetails.put("path", request.getRequestURI());

        objectMapper.writeValue(response.getWriter(), errorDetails);
    }
}