package com.hrplatform.app.modules.auth.controller;

import com.hrplatform.app.modules.auth.dto.CreateUserRequest;
import com.hrplatform.app.modules.auth.dto.UpdateUserRoleRequest;
import com.hrplatform.app.modules.auth.dto.UserResponse;
import com.hrplatform.app.modules.auth.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
    public class UserController {
    private final UserService userService;

    public UserController(UserService userService){
        this.userService=userService;
    }
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        return ResponseEntity.ok(userService.getByEmail(authentication.getName()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request){
        UserResponse response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateRole (@PathVariable UUID id,
                                                    @Valid @RequestBody UpdateUserRoleRequest request) {
        UserResponse response = userService.updateRole(id, request);
        return ResponseEntity.ok(response);
    }
}
