package com.example.gestionexpedientesbackend.repository;

import com.example.gestionexpedientesbackend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByCorreo(String correo);

    boolean existsByDni(String dni);

    boolean existsByCorreo(String correo);
}
