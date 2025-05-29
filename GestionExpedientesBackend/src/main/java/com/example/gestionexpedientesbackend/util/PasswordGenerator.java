package com.example.gestionexpedientesbackend.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGenerator {
    public static void main(String[] args) {
        String rawPassword = "admin123";
        String hashed = new BCryptPasswordEncoder().encode(rawPassword);
        System.out.println("Contraseña encriptada para 'admin123':");
        System.out.println(hashed);
    }
}
