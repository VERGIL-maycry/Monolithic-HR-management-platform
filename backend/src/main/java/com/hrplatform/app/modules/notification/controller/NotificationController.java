package com.hrplatform.app.modules.notification.controller;

import com.hrplatform.app.modules.notification.dto.NotificationResponse;
import com.hrplatform.app.modules.notification.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // =========================================================================
    // 1. GET /api/notifications/me : LISTER MES NOTIFICATIONS
    // Accessible à tout utilisateur authentifié
    // =========================================================================
    @GetMapping("/me")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(notificationService.getMyNotifications(email));
    }

    // =========================================================================
    // 2. GET /api/notifications/me/unread-count : COMPTER LES NON LUES
    // Accessible à tout utilisateur authentifié
    // =========================================================================
    @GetMapping("/me/unread-count")
    public ResponseEntity<Long> getUnreadCount(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(notificationService.getUnreadCount(email));
    }

    // =========================================================================
    // 3. PATCH /api/notifications/{id}/read : MARQUER COMME LUE
    // Accessible à tout utilisateur authentifié
    // =========================================================================
    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable UUID id,
                                                           Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(notificationService.markAsRead(id, email));
    }
}