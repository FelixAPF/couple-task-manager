package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.dto.ProcedureDto;
import com.couple.taskmanager.service.ProcedureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/procedures")
@RequiredArgsConstructor
public class ProcedureController {

    private final ProcedureService procedureService;

    @GetMapping
    public ResponseEntity<List<ProcedureDto>> getProcedures() {
        return ResponseEntity.ok(procedureService.getProceduresForCurrentHousehold());
    }

    @PostMapping
    public ResponseEntity<ProcedureDto> createProcedure(@RequestBody ProcedureDto request) {
        return ResponseEntity.ok(procedureService.createProcedure(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProcedureDto> updateProcedure(@PathVariable Long id, @RequestBody ProcedureDto request) {
        return ResponseEntity.ok(procedureService.updateProcedure(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProcedure(@PathVariable Long id) {
        procedureService.deleteProcedure(id);
        return ResponseEntity.ok().build();
    }
}