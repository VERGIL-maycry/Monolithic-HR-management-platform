package com.hrplatform.app.modules.leave.repository;

import com.hrplatform.app.modules.leave.entity.LeaveRequest;
import com.hrplatform.app.modules.leave.entity.LeaveStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {

    // 1. Liste toutes les demandes d'un employé spécifique
    List<LeaveRequest> findByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);

    // 2. Liste toutes les demandes des membres de l'équipe d'un manager
    // Spring Data JPA traverse la relation : leaveRequest.employee.manager.id
    List<LeaveRequest> findByEmployeeManagerIdOrderByCreatedAtDesc(UUID managerId);

    // 3. Liste les demandes de l'équipe filtrées par statut (ex: toutes les demandes PENDING)
    List<LeaveRequest> findByEmployeeManagerIdAndStatusOrderByCreatedAtDesc(UUID managerId, LeaveStatus status);

    List<LeaveRequest> findAllByOrderByCreatedAtDesc();

    List<LeaveRequest> findByStatusOrderByCreatedAtDesc(LeaveStatus status);
}