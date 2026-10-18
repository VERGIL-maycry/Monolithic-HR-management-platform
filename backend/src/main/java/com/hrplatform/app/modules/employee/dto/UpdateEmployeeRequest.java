package com.hrplatform.app.modules.employee.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

// DTO pour la mise à jour des informations de profil
public record UpdateEmployeeRequest(
        @NotBlank(message = "First name is required")
        String firstName,

        @NotBlank(message = "Last name is required")
        String lastName,

        String phone,

        @NotNull(message = "Hire date is required")
        LocalDate hireDate,

        @NotNull(message = "Department ID is required")
        UUID departmentId,

        UUID managerId
) {
}