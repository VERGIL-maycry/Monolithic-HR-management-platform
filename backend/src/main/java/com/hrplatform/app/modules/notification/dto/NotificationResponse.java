package com.hrplatform.app.modules.notification.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ======================================================================
 * DTO DE RÉPONSE POUR LES NOTIFICATIONS
 * ======================================================================
 * Ce record sert à formater le JSON renvoyé aux clients (Postman/Frontend).
 * Il évite d'exposer l'entité User complète qui contient des données
 * sensibles (comme le mot de passe hashé).
 * ======================================================================
 */
public record NotificationResponse(
        UUID id,
        String title,
        String message,
        boolean read,
        LocalDateTime createdAt
) {
}