package com.hrplatform.app.modules.employee.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateDepartmentRequest(
        @NotBlank(message= "Department name is required")
        String name,
        String description
) {
}
