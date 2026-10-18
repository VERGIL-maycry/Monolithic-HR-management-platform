package com.hrplatform.app.modules.leave.event;

import java.util.UUID;

/**
 * ======================================================================
 * ÉVÉNEMENT : DEMANDE DE CONGÉ APPROUVÉE
 * ======================================================================
 * Publié par le LeaveService quand un manager approuve une demande.
 *
 * QUI ÉCOUTE ?
 * - NotificationEventListener → crée une notification pour l'EMPLOYÉ
 *   ("Votre demande de 5 jours a été approuvée")
 * - AuditEventListener → enregistre un log d'audit
 * ======================================================================
 */
public class LeaveApprovedEvent {

    // ID de l'utilisateur (User) de l'employé à notifier
    private final UUID employeeUserId;

    // Nom complet de l'employé (ex: "Sara Alami")
    private final String employeeFullName;

    // Nombre de jours approuvés
    private final int days;

    // Commentaire du manager (ex: "Bon congé !")
    private final String managerComment;

    // Identifiant de la demande (pour le log d'audit)
    private final UUID leaveRequestId;

    // Email du manager qui a approuvé (pour le log d'audit)
    private final String managerEmail;

    public LeaveApprovedEvent(UUID employeeUserId, String employeeFullName,
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