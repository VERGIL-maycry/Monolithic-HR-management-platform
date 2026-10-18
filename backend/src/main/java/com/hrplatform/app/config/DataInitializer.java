package com.hrplatform.app.config;

import com.hrplatform.app.modules.auth.entity.Role;
import com.hrplatform.app.modules.auth.entity.User;
import com.hrplatform.app.modules.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmail("admin@hr.com")) {
            return; // déjà créé → on ne refait rien
        }

        User admin = new User(
                "admin@hr.com",
                passwordEncoder.encode("admin123"),
                Role.ADMIN
        );

        userRepository.save(admin);
        System.out.println("Admin user created: admin@hr.com / admin123");
    }
}