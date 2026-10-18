package com.hrplatform.app.modules.leave.entity;

import com.hrplatform.app.modules.employee.entity.Employee;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "leave_requests")
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // L'employé qui a déposé la demande
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    // Date de début et date de fin du congé
    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    // Nombre de jours calculé (ex: du lundi au vendredi = 5 jours)
    @Column(nullable = false)
    private int days;

    // Type de congé (PAID_LEAVE, UNPAID_LEAVE, etc.)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveType type;

    // Motif / raison du congé (ex: "Vacances d'été")
    @Column(length = 500)
    private String reason;

    // Statut de la demande (PENDING par défaut à la création)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveStatus status = LeaveStatus.PENDING;

    // Date de soumission de la demande
    @Column(nullable = false)
    private LocalDate createdAt = LocalDate.now();

    // Commentaire éventuel du manager lors du refus ou acceptation
    @Column(length = 500)
    private String managerComment;

    public LeaveRequest() {
    }

    public LeaveRequest(Employee employee, LocalDate startDate, LocalDate endDate, int days,
                        LeaveType type, String reason) {
        this.employee = employee;
        this.startDate = startDate;
        this.endDate = endDate;
        this.days = days;
        this.type = type;
        this.reason = reason;
        this.status = LeaveStatus.PENDING;
        this.createdAt = LocalDate.now();
    }

    // --- Getters et Setters ---

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public int getDays() {
        return days;
    }

    public void setDays(int days) {
        this.days = days;
    }

    public LeaveType getType() {
        return type;
    }

    public void setType(LeaveType type) {
        this.type = type;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LeaveStatus getStatus() {
        return status;
    }

    public void setStatus(LeaveStatus status) {
        this.status = status;
    }

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDate createdAt) {
        this.createdAt = createdAt;
    }

    public String getManagerComment() {
        return managerComment;
    }

    public void setManagerComment(String managerComment) {
        this.managerComment = managerComment;
    }
}