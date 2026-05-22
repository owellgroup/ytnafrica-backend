package com.ytnafrica.backend.config;

import com.ytnafrica.backend.model.Admin;
import com.ytnafrica.backend.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    public static final String SYSTEM_ADMIN_EMAIL = "admin@ytnafrica.live";
    public static final String SYSTEM_ADMIN_PASSWORD = "Admin@ytnafrica!";

    @Autowired
    private AdminRepository adminRepository;

    @Override
    public void run(String... args) {
        adminRepository.findByEmail(SYSTEM_ADMIN_EMAIL).ifPresentOrElse(
            admin -> {
                if (!admin.isSystemAdmin()) {
                    admin.setSystemAdmin(true);
                    adminRepository.save(admin);
                }
            },
            () -> {
                Admin systemAdmin = new Admin(SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD);
                systemAdmin.setSystemAdmin(true);
                adminRepository.save(systemAdmin);
            }
        );
    }
}
