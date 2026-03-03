package com.couple.taskmanager.controller;

import com.couple.taskmanager.exception.TokenRefreshException;
import com.couple.taskmanager.model.AuthRequest;
import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.RefreshToken;
import com.couple.taskmanager.model.dto.JwtResponse;
import com.couple.taskmanager.model.dto.RefreshTokenRequest;
import com.couple.taskmanager.model.dto.RegisterRequestDto;
import com.couple.taskmanager.service.CTMUserService;
import com.couple.taskmanager.service.RefreshTokenService;
import com.couple.taskmanager.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private CTMUserService userService;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @PostMapping("/register")
    public ResponseEntity<CTMUser> register(@RequestBody RegisterRequestDto requestDto) {
        return ResponseEntity.ok(userService.register(requestDto));
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> authenticateAndGetToken(@RequestBody AuthRequest authRequest) {
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(authRequest.getEmail(), authRequest.getPassword()));
        if (authentication.isAuthenticated()) {
            String token = jwtUtils.generateToken(authRequest.getEmail());
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(authRequest.getEmail());

            return ResponseEntity.ok(new JwtResponse(token, refreshToken.getToken()));
        } else {
            throw new UsernameNotFoundException("invalid user request !");
        }
    }

    @PostMapping("/logout")
    public void logout(@AuthenticationPrincipal CTMUser user){
        refreshTokenService.deleteByUserId(user.getId());
    }

    @PostMapping("/refresh")
    public ResponseEntity<JwtResponse> refreshtoken(@RequestBody RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(request)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    // 1. On génère le nouvel Access Token (courte durée)
                    String token = jwtUtils.generateToken(user.getEmail());

                    // 2. NOUVEAU : On génère un NOUVEAU Refresh Token (qui écrase l'ancien en base de données)
                    // Cela repousse la date d'expiration de 6 mois (ou la durée configurée)
                    RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getEmail());

                    // 3. On renvoie les DEUX nouveaux jetons au front-end
                    return ResponseEntity.ok(new JwtResponse(token, newRefreshToken.getToken()));
                })
                .orElseThrow(() -> new TokenRefreshException("Refresh token is not in database!"));
    }

    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(@AuthenticationPrincipal CTMUser user){
        userService.deleteUserAccount(user.getId(), user);
        return ResponseEntity.ok().build();
    }
}
