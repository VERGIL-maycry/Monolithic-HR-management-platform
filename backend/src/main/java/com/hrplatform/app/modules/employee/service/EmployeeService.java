package com.hrplatform.app.modules.employee.service;

import com.hrplatform.app.modules.auth.entity.Role;
import com.hrplatform.app.modules.auth.entity.User;
import com.hrplatform.app.modules.auth.repository.UserRepository;
import com.hrplatform.app.modules.employee.dto.CreateEmployeeRequest;
import com.hrplatform.app.modules.employee.dto.EmployeeResponse;
import com.hrplatform.app.modules.employee.dto.UpdateEmployeeRequest;
import com.hrplatform.app.modules.employee.entity.Department;
import com.hrplatform.app.modules.employee.entity.Employee;
import com.hrplatform.app.modules.employee.repository.DepartmentRepository;
import com.hrplatform.app.modules.employee.repository.EmployeeRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class EmployeeService {

    // Injection des 4 dépendances nécessaires
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeService(EmployeeRepository employeeRepository,
                           DepartmentRepository departmentRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // =========================================================================
    // 1. CRÉATION D'UN EMPLOYÉ ET DE SON COMPTE UTILISATEUR EN UNE TRANSACTION
    // =========================================================================
    @Transactional
    public EmployeeResponse create(CreateEmployeeRequest request) {
        // Étape A : Vérifier les doublons
        if (employeeRepository.existsByEmployeeCode(request.employeeCode())) {
            throw new IllegalArgumentException("Employee code already exists: " + request.employeeCode());
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists: " + request.email());
        }

        // Étape B : Récupérer le département (doit obligatoirement exister)
        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new IllegalArgumentException("Department not found: " + request.departmentId()));

        // Étape C : Récupérer le manager si un ID est fourni
        Employee manager = null;
        if (request.managerId() != null) {
            manager = employeeRepository.findById(request.managerId())
                    .orElseThrow(() -> new IllegalArgumentException("Manager not found: " + request.managerId()));
        }

        // Étape D : Créer et enregistrer le compte User (avec mot de passe hashé en BCrypt)
        Role role = request.role() != null ? request.role() : Role.EMPLOYEE;
        User user = new User(
                request.email(),
                passwordEncoder.encode(request.password()),
                role
        );
        User savedUser = userRepository.save(user);

        // Étape E : Créer et enregistrer l'Employé lié au User et au Département
        Employee employee = new Employee(
                request.employeeCode(),
                request.firstName(),
                request.lastName(),
                request.phone(),
                request.hireDate(),
                savedUser,
                department,
                manager
        );
        Employee savedEmployee = employeeRepository.save(employee);

        // Étape F : Retourner la réponse formatée
        return toResponse(savedEmployee);
    }

    // =========================================================================
    // 2. LISTER TOUS LES EMPLOYÉS
    // =========================================================================
    public List<EmployeeResponse> findAll() {
        return employeeRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================================
    // 3. TROUVER UN EMPLOYÉ PAR SON ID
    // =========================================================================
    public EmployeeResponse findById(UUID id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + id));
        return toResponse(employee);
    }

    // =========================================================================
    // 4. TROUVER LE PROFIL DE L'UTILISATEUR CONNECTÉ (POUR /me)
    // =========================================================================
    public EmployeeResponse findByCurrentUser(String userEmail) {
        Employee employee = employeeRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("No employee profile found for user: " + userEmail));
        return toResponse(employee);
    }

    // =========================================================================
    // 5. MODIFIER UN EMPLOYÉ EXISTANT
    // =========================================================================
    @Transactional
    public EmployeeResponse update(UUID id, UpdateEmployeeRequest request) {
        // Trouver l'employé à modifier
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + id));

        // Vérifier le nouveau département
        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new IllegalArgumentException("Department not found: " + request.departmentId()));

        // Vérifier le manager s'il y en a un (un employé ne peut pas être son propre manager !)
        Employee manager = null;
        if (request.managerId() != null) {
            if (request.managerId().equals(id)) {
                throw new IllegalArgumentException("An employee cannot be their own manager");
            }
            manager = employeeRepository.findById(request.managerId())
                    .orElseThrow(() -> new IllegalArgumentException("Manager not found: " + request.managerId()));
        }

        // Mettre à jour les champs
        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setPhone(request.phone());
        employee.setHireDate(request.hireDate());
        employee.setDepartment(department);
        employee.setManager(manager);

        Employee saved = employeeRepository.save(employee);
        return toResponse(saved);
    }

    // =========================================================================
    // MÉTHODE UTILITAIRE PRIVÉE : CONVERTIT UNE ENTITÉ EN DTO DE RÉPONSE
    // =========================================================================
    private EmployeeResponse toResponse(Employee employee) {
        String managerFullName = null;
        UUID managerId = null;

        // Si l'employé a un manager, on extrait son ID et son Nom complet
        if (employee.getManager() != null) {
            managerId = employee.getManager().getId();
            managerFullName = employee.getManager().getFirstName() + " " + employee.getManager().getLastName();
        }

        return new EmployeeResponse(
                employee.getId(),
                employee.getEmployeeCode(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getUser().getEmail(),
                employee.getUser().getRole(),
                employee.getPhone(),
                employee.getHireDate(),
                employee.getDepartment().getId(),
                employee.getDepartment().getName(),
                managerId,
                managerFullName
        );
    }
}