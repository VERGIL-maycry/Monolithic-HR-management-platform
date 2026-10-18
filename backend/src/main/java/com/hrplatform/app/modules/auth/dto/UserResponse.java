package com.hrplatform.app.modules.auth.dto;

import com.hrplatform.app.modules.auth.entity.Role;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        Role role,
        boolean enabled
) {
}
