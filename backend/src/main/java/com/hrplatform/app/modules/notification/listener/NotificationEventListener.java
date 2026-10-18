package com.hrplatform.app.modules.notification.listener;

import com.hrplatform.app.modules.auth.entity.User;
import com.hrplatform.app.modules.auth.repository.UserRepository;
import com.hrplatform.app.modules.leave.event.LeaveApprovedEvent;
import com.hrplatform.app.modules.leave.event.LeaveRejectedEvent;
import com.hrplatform.app.modules.leave.event.LeaveRequestedEvent;
import com.hrplatform.app.modules.notification.service.NotificationService;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationEventListener(NotificationService notificationService, UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    // =========================================================================
    // 1. ÉCOUTE : NOUVELLE DEMANDE DE CONGÉ
    // But : Notifier le MANAGER de l'employé
    // =========================================================================
    @EventListener
    public void handleLeaveRequested(LeaveRequestedEvent event) {
        // Retrouver le compte utilisateur du manager pour lier la notification
        User managerUser = userRepository.findById(event.getManagerUserId())
                .orElse(null);

        if (managerUser != null) {
            String title = "Nouvelle demande de congé";
            String message = String.format(
                    "L'employé(e) %s a déposé une demande de %d jours de congé pour la période du %s au %s.",
                    event.getEmployeeFullName(),
                    event.getDays(),
                    event.getStartDate(),
                    event.getEndDate()
            );

            notificationService.createNotification(managerUser, title, message);
        }
    }

    // =========================================================================
    // 2. ÉCOUTE : DEMANDE DE CONGÉ APPROUVÉE
    // But : Notifier l'EMPLOYÉ demandeur
    // =========================================================================
    @EventListener
    public void handleLeaveApproved(LeaveApprovedEvent event) {
        User employeeUser = userRepository.findById(event.getEmployeeUserId())
                .orElse(null);

        if (employeeUser != null) {
            String title = "Demande de congé acceptée";
            String message = String.format(
                    "Votre demande de %d jours de congé a été approuvée par votre manager.%s",
                    event.getDays(),
                    event.getManagerComment() != null ? " Commentaire : " + event.getManagerComment() : ""
            );

            notificationService.createNotification(employeeUser, title, message);
        }
    }

    // =========================================================================
    // 3. ÉCOUTE : DEMANDE DE CONGÉ REFUSÉE
    // But : Notifier l'EMPLOYÉ demandeur
    // =========================================================================
    @EventListener
    public void handleLeaveRejected(LeaveRejectedEvent event) {
        User employeeUser = userRepository.findById(event.getEmployeeUserId())
                .orElse(null);

        if (employeeUser != null) {
            String title = "Demande de congé refusée";
            String message = String.format(
                    "Votre demande de %d jours de congé a été refusée par votre manager.%s",
                    event.getDays(),
                    event.getManagerComment() != null ? " Motif du refus : " + event.getManagerComment() : ""
            );

            notificationService.createNotification(employeeUser, title, message);
        }
    }
}