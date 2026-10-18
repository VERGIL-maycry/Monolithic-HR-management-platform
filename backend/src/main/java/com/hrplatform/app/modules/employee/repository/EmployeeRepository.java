package com.hrplatform.app.modules.employee.repository;

import com.hrplatform.app.modules.employee.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    boolean existsByEmployeeCode(String employeeCode);

    Optional<Employee> findByUserId(UUID userId);

    Optional<Employee> findByUserEmail(String email);

}