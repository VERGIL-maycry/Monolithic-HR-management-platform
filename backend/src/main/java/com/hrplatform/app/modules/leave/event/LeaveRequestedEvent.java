package com.hrplatform.app.modules.leave.event;

import java.time.LocalDate;
import java.util.UUID;

/**
 * ======================================================================
 * ÉVÉNEMENT : DEMANDE DE CONGÉ DÉPOSÉE
 * ======================================================================
 * Cet événement est publié par le LeaveService quand un employé dépose
 * une nouvelle demande de congé.
 *
 * QUI ÉCOUTE CET ÉVÉNEMENT ?
 * - NotificationEventListener → crée une notification pour le MANAGER
 * - AuditEventListener → enregistre un log d'audit
 *
 * POURQUOI UN ÉVÉNEMENT PLUTÔT QU'UN APPEL DIRECT ?
 * → Découplage : le LeaveService ne connaît pas le module Notifications.
 *   Si on supprime le module Notifications, le LeaveService continue de
 *   fonctionner normalement. C'est le principe "Open/Closed" de SOLID.
 * ======================================================================
 */
public class LeaveRequestedEvent {

    // Nom complet de l'employé qui a déposé la demande (ex: "Sara Alami")
    private final String employeeFullName;

    // ID de l'utilisateur (User) du manager à notifier
    private final UUID managerUserId;

    // Nombre de jours demandés
    private final int days;

    // Dates de début et fin du congé
    private final LocalDate startDate;
    private final LocalDate endDate;

    // Identifiant de la demande de congé (pour référence dans le log d'audit)
    private final UUID leaveRequestId;

    // Email de l'employé qui a fait la demande (pour le log d'audit)
    private final String employeeEmail;

    public LeaveRequestedEvent(String employeeFullName, UUID managerUserId,
                               int days, LocalDate startDate, LocalDate endDate,
                               UUID leaveRequestId, String employeeEmail) {
        this.employeeFullName = employeeFullName;
        this.managerUserId = managerUserId;
        this.days = days;
        this.startDate = startDate;
        this.endDate = endDate;
        this.leaveRequestId = leaveRequestId;
        this.employeeEmail = employeeEmail;
    }

    // --- Getters ---

    public String getEmployeeFullName() {
        return employeeFullName;
    }

    public UUID getManagerUserId() {
        return managerUserId;
    }

    public int getDays() {
        return days;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public UUID getLeaveRequestId() {
        return leaveRequestId;
    }

    public String getEmployeeEmail() {
        return employeeEmail;
    }
}