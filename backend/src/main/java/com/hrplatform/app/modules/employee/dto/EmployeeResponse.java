package com.hrplatform.app.modules.employee.dto;

import com.hrplatform.app.modules.auth.entity.Role;

import java.time.LocalDate;
import java.util.UUID;

// DTO de réponse : contient toutes les informations lisibles sans jamais exposer le mot de passe !
public record EmployeeResponse(
        UUID id,
        String employeeCode,
        String firstName,
        String lastName,
        String email,
        Role role,
        String phone,
        LocalDate hireDate,
        UUID departmentId,
        String departmentName,
        UUID managerId,
        String managerFullName
) {
}