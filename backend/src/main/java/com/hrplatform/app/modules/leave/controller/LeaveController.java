package com.hrplatform.app.modules.leave.controller;

import com.hrplatform.app.modules.leave.dto.*;
import com.hrplatform.app.modules.leave.entity.LeaveStatus;
import com.hrplatform.app.modules.leave.service.LeaveService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService leaveService;

    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    // 1. Déposer une demande de congé
    @PostMapping
    public ResponseEntity<LeaveResponse> createLeave(@Valid @RequestBody CreateLeaveRequest request,
                                                     Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(leaveService.createLeaveRequest(email, request));
    }

    // 2. Consulter mes propres demandes de congés
    @GetMapping("/me")
    public ResponseEntity<List<LeaveResponse>> getMyLeaves(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(leaveService.getMyLeaves(email));
    }

    // 3. Consulter mon solde de congés (Étape 3.3)
    @GetMapping("/balance/me")
    public ResponseEntity<LeaveBalanceResponse> getMyBalance(@RequestParam(required = false) Integer year,
                                                             Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(leaveService.getMyBalance(email, year));
    }

    // 4. Le manager consulte les demandes de son équipe
    @GetMapping("/team")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<List<LeaveResponse>> getTeamLeaves(@RequestParam(required = false) LeaveStatus status,
                                                             Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(leaveService.getTeamLeaves(email, status));
    }

    // 5. Le manager accepte une demande
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<LeaveResponse> approveLeave(@PathVariable UUID id,
                                                      @RequestBody(required = false) ReviewLeaveRequest review,
                                                      Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(leaveService.approveLeave(id, email, review));
    }

    // 6. Le manager refuse une demande
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<LeaveResponse> rejectLeave(@PathVariable UUID id,
                                                     @RequestBody(required = false) ReviewLeaveRequest review,
                                                     Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(leaveService.rejectLeave(id, email, review));
    }

    // 7. L'employé annule sa demande
    @PostMapping("/{id}/cancel")
    public ResponseEntity<LeaveResponse> cancelLeave(@PathVariable UUID id,
                                                     Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(leaveService.cancelLeave(id, email));
    }
}