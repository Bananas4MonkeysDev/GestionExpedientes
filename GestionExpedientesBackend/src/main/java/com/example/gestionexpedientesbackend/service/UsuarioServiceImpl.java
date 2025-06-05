package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.model.Usuario;
import com.example.gestionexpedientesbackend.repository.UsuarioRepository;
import com.example.gestionexpedientesbackend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;  // ← Asegúrate que esté aquí
    public boolean existsByCorreo(String correo) {
        return usuarioRepository.existsByCorreo(correo);
    }

    // Verificar si el DNI ya existe
    public boolean existsByDni(String dni) {
        return usuarioRepository.existsByDni(dni);
    }
    @Override
    public Usuario registrar(Usuario usuario) {
        // Encripta la contraseña antes de guardar
        usuario.setContraseña(passwordEncoder.encode(usuario.getContraseña()));
        return usuarioRepository.save(usuario);
    }

    @Override
    public Usuario login(String correo, String contraseña) {
        Optional<Usuario> userOpt = usuarioRepository.findByCorreo(correo);
        if (userOpt.isPresent()) {
            Usuario user = userOpt.get();
            if (passwordEncoder.matches(contraseña, user.getContraseña())) {
                return user;
            }
        }
        return null;
    }
    @Override
    public List<Usuario> obtenerPorIdsSeparados(String idsSeparadosPorPipe) {
        if (idsSeparadosPorPipe == null || idsSeparadosPorPipe.isEmpty()) return List.of();
        List<Long> ids = Arrays.stream(idsSeparadosPorPipe.split("\\|"))
                .map(Long::valueOf)
                .collect(Collectors.toList());
        return usuarioRepository.findAllById(ids);
    }
    public List<Usuario> obtenerTodos() {
        return usuarioRepository.findAll(); // o aplica filtros si deseas solo ciertos tipos
    }

}
