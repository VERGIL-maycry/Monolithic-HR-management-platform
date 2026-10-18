package com.hrplatform.app.modules.employee.dto;

import com.hrplatform.app.modules.auth.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

// DTO immuable (record) pour valider les données de création d'un employé
public record CreateEmployeeRequest(
        // Le matricule est obligatoire
        @NotBlank(message = "Employee code is required")
        String employeeCode,

        // Prénom et nom obligatoires
        @NotBlank(message = "First name is required")
        String firstName,

        @NotBlank(message = "Last name is required")
        String lastName,

        // Données du compte utilisateur à créer
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        String password,

        // Rôle attribué (EMPLOYEE ou MANAGER). Si non fourni, on mettra EMPLOYEE par défaut
        Role role,

        // Téléphone optionnel
        String phone,

        // Date d'embauche obligatoire (format: YYYY-MM-DD)
        @NotNull(message = "Hire date is required")
        LocalDate hireDate,

        // L'ID du département auquel rattacher l'employé
        @NotNull(message = "Department ID is required")
        UUID departmentId,

        // L'ID du manager (optionnel)
        UUID managerId
) {
}