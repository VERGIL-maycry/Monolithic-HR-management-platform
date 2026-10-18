package com.hrplatform.app.modules.employee.repository;

import com.hrplatform.app.modules.employee.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    boolean existsByName(String name);
}
