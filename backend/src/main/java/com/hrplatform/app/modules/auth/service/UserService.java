package com.hrplatform.app.modules.auth.service;

import com.hrplatform.app.modules.auth.dto.CreateUserRequest;
import com.hrplatform.app.modules.auth.dto.UpdateUserRoleRequest;
import com.hrplatform.app.modules.auth.dto.UserResponse;
import com.hrplatform.app.modules.auth.entity.User;
import com.hrplatform.app.modules.auth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder){
        this.userRepository=userRepository;
        this.passwordEncoder=passwordEncoder;
    }
    public UserResponse createUser(CreateUserRequest request){
        if(userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists: " + request.email());
        }
        User user= new User(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.role()
        );
        User saved = userRepository.save(user);
        return toResponse(saved);
        }
    public UserResponse getByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        return toResponse(user);
    }

    public UserResponse updateRole(UUID userId, UpdateUserRoleRequest request){
        User user = userRepository.findById(userId)
                .orElseThrow(()-> new IllegalArgumentException("User not found: "+ userId));
        user.setRole(request.role());
        User saved = userRepository.save(user);
        return toResponse(saved);
    }
    private UserResponse toResponse(User user){
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.isEnabled()
        );
    }
}
