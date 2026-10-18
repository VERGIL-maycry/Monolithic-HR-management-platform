package com.hrplatform.app.modules.auth.dto;

import com.hrplatform.app.modules.auth.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
        @NotNull Role role
) {
}
