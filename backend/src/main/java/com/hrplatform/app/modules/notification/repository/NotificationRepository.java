package com.hrplatform.app.modules.notification.repository;

import com.hrplatform.app.modules.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

// JpaRepository nous donne automatiquement les méthodes de base : save(), findById(), etc.
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    // 1. Récupère toutes les notifications d'un utilisateur, de la plus récente à la plus ancienne
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);

    // 2. Compte le nombre de notifications non lues (read = false) d'un utilisateur
    long countByUserIdAndReadFalse(UUID userId);
}