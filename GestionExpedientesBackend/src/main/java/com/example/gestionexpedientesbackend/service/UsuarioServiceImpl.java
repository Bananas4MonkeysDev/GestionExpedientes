package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.model.Usuario;
import com.example.gestionexpedientesbackend.repository.UsuarioRepository;
import com.example.gestionexpedientesbackend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;  // ← Asegúrate que esté aquí
    @Override
    public List<Usuario> obtenerTodos() {
        return usuarioRepository.findAll();
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
}
