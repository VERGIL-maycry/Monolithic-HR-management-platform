package com.hrplatform.app.modules.notification.entity;

import com.hrplatform.app.modules.auth.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

// 1. Indique à JPA que cette classe correspond à une table en BDD nommée "notifications"
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // 2. Le titre de la notification (ex: "Nouvelle demande de congé")
    @Column(nullable = false)
    private String title;

    // 3. Le message détaillé (ex: "Sara Alami a demandé 5 jours de congé.")
    @Column(nullable = false, length = 1000)
    private String message;

    // 4. Indique si la notification a été lue par l'utilisateur
    @Column(nullable = false)
    private boolean read = false;

    // 5. Date et heure de création de la notification
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // 6. L'utilisateur (destinataire) à qui appartient la notification
    // Plusieurs notifications peuvent appartenir au même utilisateur (Many-to-One)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Constructeur vide obligatoire pour Hibernate
    public Notification() {
    }

    // Constructeur pratique pour instancier rapidement une notification
    public Notification(User user, String title, String message) {
        this.user = user;
        this.title = title;
        this.message = message;
        this.read = false;
        this.createdAt = LocalDateTime.now();
    }

    // --- Getters et Setters ---

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}