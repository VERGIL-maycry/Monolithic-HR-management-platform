package com.hrplatform.app.modules.employee.service;

import com.hrplatform.app.modules.employee.dto.CreateDepartmentRequest;
import com.hrplatform.app.modules.employee.dto.DepartmentResponse;
import com.hrplatform.app.modules.employee.entity.Department;
import com.hrplatform.app.modules.employee.repository.DepartmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    // 1. LE CONSTRUCTEUR (il sert uniquement à injecter le repository)
    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    // 2. LA MÉTHODE POUR CRÉER UN DÉPARTEMENT
    public DepartmentResponse create(CreateDepartmentRequest request) {
        if (departmentRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("Department already exists: " + request.name());
        }

        Department department = new Department(request.name(), request.description());
        Department saved = departmentRepository.save(department);
        return toResponse(saved);
    }

    // 3. LA MÉTHODE POUR LISTER TOUS LES DÉPARTEMENTS (renvoie une List)
    public List<DepartmentResponse> findAll() {
        return departmentRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // 4. LA MÉTHODE POUR TROUVER UN DÉPARTEMENT PAR SON ID (renvoie un seul DepartmentResponse)
    public DepartmentResponse findById(UUID id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found: " + id));
        return toResponse(department);
    }

    // 5. MÉTHODE PRIVÉE POUR TRANSFORMER L'ENTITÉ EN DTO
    private DepartmentResponse toResponse(Department department) {
        return new DepartmentResponse(
                department.getId(),
                department.getName(),
                department.getDescription()
        );
    }
}