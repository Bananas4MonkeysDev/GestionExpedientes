package com.example.gestionexpedientesbackend.controller;

import com.example.gestionexpedientesbackend.dto.AuthRequest;
import com.example.gestionexpedientesbackend.dto.AuthResponse;
import com.example.gestionexpedientesbackend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    @Autowired
    private AuthenticationManager authManager;
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest req) {
        log.info("Intentando autenticación de: {}", req.getCorreo());
        log.info("Autenticando usuario: " + req.getCorreo());
        log.info("Contraseña recibida: {}", req.getContraseña());

        try {

        Authentication authentication = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getCorreo(), req.getContraseña())
        );
        log.info("Autenticación exitosa para: {}", req.getCorreo());

        String token = jwtUtil.generateToken(req.getCorreo());
        log.info(" Token generado para {}: {}", req.getCorreo(), token);

        return ResponseEntity.ok(new AuthResponse(token));
        } catch (Exception e) {
            log.error("Fallo en autenticación: ", e);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

    }
}
