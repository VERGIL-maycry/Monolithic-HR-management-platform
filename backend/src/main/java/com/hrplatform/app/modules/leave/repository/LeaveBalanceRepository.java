package com.hrplatform.app.modules.leave.repository;

import com.hrplatform.app.modules.leave.entity.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, UUID> {

    // Trouve le solde d'un employé pour une année donnée (ex: l'employé X en 2026)
    Optional<LeaveBalance> findByEmployeeIdAndYear(UUID employeeId, int year);
}