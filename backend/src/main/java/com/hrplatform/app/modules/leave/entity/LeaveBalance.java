package com.hrplatform.app.modules.leave.entity;

import com.hrplatform.app.modules.employee.entity.Employee;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "leave_balances")
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Chaque solde est associé à un employé
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    // L'année de référence (ex: 2026)
    @Column(name = "balance_year", nullable = false)
    private int year;

    // Total des jours alloués par l'entreprise par an (ex: 22 jours)
    @Column(nullable = false)
    private int totalDays = 22;

    // Nombre de jours déjà pris / consommés
    @Column(nullable = false)
    private int usedDays = 0;

    // Nombre de jours restants disponibles (totalDays - usedDays)
    @Column(nullable = false)
    private int remainingDays = 22;

    public LeaveBalance() {
    }

    public LeaveBalance(Employee employee, int year, int totalDays) {
        this.employee = employee;
        this.year = year;
        this.totalDays = totalDays;
        this.usedDays = 0;
        this.remainingDays = totalDays;
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

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public int getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(int totalDays) {
        this.totalDays = totalDays;
    }

    public int getUsedDays() {
        return usedDays;
    }

    public void setUsedDays(int usedDays) {
        this.usedDays = usedDays;
    }

    public int getRemainingDays() {
        return remainingDays;
    }

    public void setRemainingDays(int remainingDays) {
        this.remainingDays = remainingDays;
    }
}