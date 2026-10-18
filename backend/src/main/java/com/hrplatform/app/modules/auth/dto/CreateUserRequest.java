package com.hrplatform.app.modules.auth.dto;
import com.hrplatform.app.modules.auth.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
public record CreateUserRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min=6) String password,
        @NotNull Role role) {
}
