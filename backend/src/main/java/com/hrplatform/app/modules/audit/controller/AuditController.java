package com.hrplatform.app.modules.audit.controller;

import com.hrplatform.app.modules.audit.dto.AuditLogResponse;
import com.hrplatform.app.modules.audit.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin/HR‑only REST endpoints for reading audit logs.
 */
@RestController
@RequestMapping("/api/audit")
@PreAuthorize("hasAnyRole('ADMIN','HR')")   // restrict to privileged roles
public class AuditController {

    private final AuditService audit;

    public AuditController(AuditService audit) {
        this.audit = audit;
    }

    /** GET /api/audit/all – all logs (newest first). */
    @GetMapping("/all")
    public ResponseEntity<List<AuditLogResponse>> all() {
        return ResponseEntity.ok(audit.getAll());
    }

    /** GET /api/audit/user?email=… – logs for a specific user. */
    @GetMapping("/user")
    public ResponseEntity<List<AuditLogResponse>> byUser(@RequestParam String email) {
        return ResponseEntity.ok(audit.getByUser(email));
    }

    /** GET /api/audit/action?type=… – logs for a specific action. */
    @GetMapping("/action")
    public ResponseEntity<List<AuditLogResponse>> byAction(@RequestParam String type) {
        return ResponseEntity.ok(audit.getByAction(type));
    }
}