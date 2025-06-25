package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.model.Usuario;
import com.example.gestionexpedientesbackend.repository.UsuarioRepository;
import com.example.gestionexpedientesbackend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private EmailService emailService;
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
    public Optional<Usuario> obtenerPorId(Long id) {
        return usuarioRepository.findById(id);
    }
    @Override
    public Usuario actualizarUsuario(Long id, Usuario usuario) {
        Optional<Usuario> existente = usuarioRepository.findById(id);
        if (existente.isPresent()) {
            Usuario actual = existente.get();
            actual.setNombre(usuario.getNombre());
            actual.setCorreo(usuario.getCorreo());
            actual.setDni(usuario.getDni());
            actual.setRuc(usuario.getRuc());
            actual.setRol(usuario.getRol());
            actual.setTipoIdentidad(usuario.getTipoIdentidad());
            actual.setTipoUsuario(usuario.getTipoUsuario());
            actual.setFirmante(usuario.getFirmante());
            actual.setTipoFirma(usuario.getTipoFirma());
            return usuarioRepository.save(actual);
        } else {
            throw new RuntimeException("Usuario no encontrado con ID: " + id);
        }
    }

    @Override
    public void eliminarUsuario(Long id) {
        usuarioRepository.deleteById(id);
    }

    @Override
    public Usuario findByCorreo(String correo) {
        return usuarioRepository.findByCorreo(correo).orElse(null);
    }

    @Override
    public void guardarTokenRecuperacion(Long usuarioId, String token) {
        Usuario usuario = usuarioRepository.findById(usuarioId).orElseThrow();
        usuario.setTokenRecuperacion(token);
        usuario.setFechaTokenRecuperacion(LocalDateTime.now().plusHours(1)); // Expira en 1 hora
        usuarioRepository.save(usuario);
    }

    @Override
    public void enviarCorreoRecuperacion(String correo, String token) {
        String asunto = "Recuperación de contraseña";
        String mensaje = "Para restablecer tu contraseña, ingresa este token: " + token;

        // Usamos el método de enviar correo simple
        emailService.enviarCorreoSimple(List.of(correo), asunto, mensaje);
    }
    @Override
    public List<Usuario> obtenerPorIds(List<Long> ids) {
        return usuarioRepository.findAllById(ids);
    }

    @Override
    public Usuario findByTokenRecuperacion(String token) {
        return usuarioRepository.findByTokenRecuperacion(token).orElse(null);
    }
    @Override
    public void actualizarContraseña(Long usuarioId, String nuevaClave) {
        Usuario usuario = usuarioRepository.findById(usuarioId).orElseThrow();
        usuario.setContraseña(passwordEncoder.encode(nuevaClave)); // Usa el passwordEncoder
        usuarioRepository.save(usuario);
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
