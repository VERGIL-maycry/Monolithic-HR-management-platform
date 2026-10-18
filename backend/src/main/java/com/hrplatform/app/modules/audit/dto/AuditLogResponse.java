package com.hrplatform.app.modules.audit.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ======================================================================
 * DTO DE RÉPONSE POUR LES LOGS D'AUDIT
 * ======================================================================
 * Ce record sert à formater le JSON renvoyé aux administrateurs/RH
 * lorsqu'ils consultent les logs d'audit.
 * ======================================================================
 */
public record AuditLogResponse(
        UUID id,
        String userEmail,
        String action,
        String detail,
        String ipAddress,
        LocalDateTime timestamp
) {
}