package com.hrplatform.app.modules.notification.service;

import com.hrplatform.app.modules.auth.entity.User;
import com.hrplatform.app.modules.auth.repository.UserRepository;
import com.hrplatform.app.modules.notification.dto.NotificationResponse;
import com.hrplatform.app.modules.notification.entity.Notification;
import com.hrplatform.app.modules.notification.repository.NotificationRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    // =========================================================================
    // 1. OBTENIR TOUTES LES NOTIFICATIONS DE L'UTILISATEUR CONNECTÉ
    // =========================================================================
    public List<NotificationResponse> getMyNotifications(String userEmail) {
        User user = getUserByEmail(userEmail);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================================
    // 2. COMPTER LE NOMBRE DE NOTIFICATIONS NON LUES DE L'UTILISATEUR CONNECTÉ
    // =========================================================================
    public long getUnreadCount(String userEmail) {
        User user = getUserByEmail(userEmail);
        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    // =========================================================================
    // 3. MARQUER UNE NOTIFICATION COMME LUE
    // =========================================================================
    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, String userEmail) {
        User user = getUserByEmail(userEmail);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));

        // Règle de sécurité : L'utilisateur ne peut modifier que sa propre notification
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are not authorized to read this notification");
        }

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return toResponse(saved);
    }

    // =========================================================================
    // 4. CRÉER ET ENREGISTRER UNE NOTIFICATION (MÉTHODE APPELÉE PAR LE LISTENER)
    // =========================================================================
    @Transactional
    public void createNotification(User user, String title, String message) {
        Notification notification = new Notification(user, title, message);
        notificationRepository.save(notification);
    }

    // =========================================================================
    // MÉTHODES UTILITAIRES PRIVÉES
    // =========================================================================

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}