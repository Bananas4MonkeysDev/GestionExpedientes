package com.example.gestionexpedientesbackend.repository;

import com.example.gestionexpedientesbackend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByCorreo(String correo);
    boolean existsByDni(String dni);
    Optional<Usuario> findByTokenRecuperacion(String token);
    List<Usuario> findAllById(Iterable<Long> ids);

    boolean existsByCorreo(String correo);
}
