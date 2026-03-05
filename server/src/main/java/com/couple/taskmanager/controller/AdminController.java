package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.dto.AdminMetricDto;
import com.couple.taskmanager.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/metrics")
    public ResponseEntity<List<AdminMetricDto>> getMetrics() {
        return ResponseEntity.ok(adminService.getHouseholdMetrics());
    }
}