package com.hrplatform.app.modules.employee.dto;
import java.util.UUID;

public record DepartmentResponse(
        UUID id,
        String name,
        String description
) {
}
