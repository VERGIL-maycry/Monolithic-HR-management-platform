package com.hrplatform.app.modules.leave.event;

import java.util.UUID;

/**
 * ======================================================================
 * ÉVÉNEMENT : DEMANDE DE CONGÉ REFUSÉE
 * ======================================================================
 * Publié par le LeaveService quand un manager refuse une demande.
 *
 * QUI ÉCOUTE ?
 * - NotificationEventListener → crée une notification pour l'EMPLOYÉ
 *   ("Votre demande a été refusée")
 * - AuditEventListener → enregistre un log d'audit
 * ======================================================================
 */
public class LeaveRejectedEvent {

    // ID de l'utilisateur (User) de l'employé à notifier
    private final UUID employeeUserId;

    // Nom complet de l'employé
    private final String employeeFullName;

    // Nombre de jours de la demande refusée
    private final int days;

    // Commentaire du manager (ex: "Période trop chargée")
    private final String managerComment;

    // Identifiant de la demande (pour le log d'audit)
    private final UUID leaveRequestId;

    // Email du manager qui a refusé (pour le log d'audit)
    private final String managerEmail;

    public LeaveRejectedEvent(UUID employeeUserId, String employeeFullName,
                              int days, String managerComment,
                              UUID leaveRequestId, String managerEmail) {
        this.employeeUserId = employeeUserId;
        this.employeeFullName = employeeFullName;
        this.days = days;
        this.managerComment = managerComment;
        this.leaveRequestId = leaveRequestId;
        this.managerEmail = managerEmail;
    }

    // --- Getters ---

    public UUID getEmployeeUserId() {
        return employeeUserId;
    }

    public String getEmployeeFullName() {
        return employeeFullName;
    }

    public int getDays() {
        return days;
    }

    public String getManagerComment() {
        return managerComment;
    }

    public UUID getLeaveRequestId() {
        return leaveRequestId;
    }

    public String getManagerEmail() {
        return managerEmail;
    }
}