package com.hrplatform.app.modules.audit.service;

import com.hrplatform.app.modules.audit.entity.AuditLog;
import com.hrplatform.app.modules.audit.repository.AuditLogRepository;
import com.hrplatform.app.modules.audit.dto.AuditLogResponse;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditService {

    private final AuditLogRepository repo;

    public AuditService(AuditLogRepository repo) {
        this.repo = repo;
    }

    // Enregistrement simple d’une action
    public void log(String userEmail, String action, String detail, String ip) {
        repo.save(new AuditLog(userEmail, action, detail, ip));
    }

    // Retourner tous les logs (admin)
    public List<AuditLogResponse> getAll() {
        return repo.findAllByOrderByTimestampDesc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // Filtrer par email (ex : suivi d’un employé)
    public List<AuditLogResponse> getByUser(String email) {
        return repo.findByUserEmailOrderByTimestampDesc(email)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // Filtrer par type d’action (ex : "LEAVE_APPROVED")
    public List<AuditLogResponse> getByAction(String action) {
        return repo.findByActionOrderByTimestampDesc(action)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private AuditLogResponse toDto(AuditLog a) {
        return new AuditLogResponse(
                a.getId(),
                a.getUserEmail(),
                a.getAction(),
                a.getDetail(),
                a.getIpAddress(),
                a.getTimestamp()
        );
    }
}