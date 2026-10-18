package com.hrplatform.app.modules.audit.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

// 1. Indique à JPA que cette classe correspond à une table en BDD nommée "audit_logs"
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // 2. Email de l'utilisateur ayant réalisé l'action (facilite la recherche)
    @Column(nullable = false)
    private String userEmail;

    // 3. Le type ou code de l'action effectuée (ex: "LEAVE_APPROVED", "USER_CREATED")
    @Column(nullable = false)
    private String action;

    // 4. Description détaillée en texte libre (ex: "Approuvé 5 jours pour Sara Alami")
    @Column(nullable = false, length = 1000)
    private String detail;

    // 5. Adresse IP depuis laquelle la requête HTTP a été envoyée
    @Column(nullable = false)
    private String ipAddress;

    // 6. Horodatage exact de l'action
    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    // Constructeur vide obligatoire pour Hibernate
    public AuditLog() {
    }

    // Constructeur pratique pour instancier rapidement un log d'audit
    public AuditLog(String userEmail, String action, String detail, String ipAddress) {
        this.userEmail = userEmail;
        this.action = action;
        this.detail = detail;
        this.ipAddress = ipAddress;
        this.timestamp = LocalDateTime.now();
    }

    // --- Getters et Setters ---

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getDetail() {
        return detail;
    }

    public void setDetail(String detail) {
        this.detail = detail;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}