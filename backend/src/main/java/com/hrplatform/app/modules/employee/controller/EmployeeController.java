package com.hrplatform.app.modules.employee.controller;

import com.hrplatform.app.modules.employee.dto.CreateEmployeeRequest;
import com.hrplatform.app.modules.employee.dto.EmployeeResponse;
import com.hrplatform.app.modules.employee.dto.UpdateEmployeeRequest;
import com.hrplatform.app.modules.employee.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    // 1. POST /api/employees : Créer un employé (Réservé aux ADMIN et RH)
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<EmployeeResponse> create(@Valid @RequestBody CreateEmployeeRequest request) {
        // Renvoie un code HTTP 201 Created avec la ressource créée
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.create(request));
    }

    // 2. GET /api/employees/me : Consulter son propre profil
    // Accessible à n'importe quel utilisateur authentifié (Employé, Manager, RH, Admin)
    @GetMapping("/me")
    public ResponseEntity<EmployeeResponse> getMyProfile(Authentication authentication) {
        // authentication.getName() contient l'email de la personne connectée (extrait du JWT)
        String email = authentication.getName();
        return ResponseEntity.ok(employeeService.findByCurrentUser(email));
    }

    // 3. GET /api/employees : Lister tous les employés (ADMIN, RH ou MANAGER)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    public ResponseEntity<List<EmployeeResponse>> findAll() {
        return ResponseEntity.ok(employeeService.findAll());
    }

    // 4. GET /api/employees/{id} : Consulter un employé par son ID (ADMIN, RH ou MANAGER)
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    public ResponseEntity<EmployeeResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(employeeService.findById(id));
    }

    // 5. PUT /api/employees/{id} : Mettre à jour un employé (ADMIN ou RH)
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<EmployeeResponse> update(@PathVariable UUID id,
                                                   @Valid @RequestBody UpdateEmployeeRequest request) {
        return ResponseEntity.ok(employeeService.update(id, request));
    }
}