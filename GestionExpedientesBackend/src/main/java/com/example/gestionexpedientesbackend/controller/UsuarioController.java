package com.example.gestionexpedientesbackend.controller;

import com.example.gestionexpedientesbackend.dto.UsuarioNombreDTO;
import com.example.gestionexpedientesbackend.model.Usuario;
import com.example.gestionexpedientesbackend.dto.UsuarioLoginDTO;
import com.example.gestionexpedientesbackend.service.EmailService;
import com.example.gestionexpedientesbackend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {
    @PostMapping("/recuperar-clave")
    public ResponseEntity<Map<String, String>> recuperarClave(@RequestBody Map<String, String> body) {
        String correo = body.get("correo");
        Usuario usuario = usuarioService.findByCorreo(correo); // Verificar si existe el usuario
        Map<String, String> response = new HashMap<>();

        if (usuario == null) {
            response.put("message", "El correo no está registrado.");
            return ResponseEntity.badRequest().body(response);
        }

        // Generar token de recuperación
        String token = UUID.randomUUID().toString();
        usuarioService.guardarTokenRecuperacion(usuario.getId(), token);

        // Enviar correo con el token
        usuarioService.enviarCorreoRecuperacion(usuario.getCorreo(), token);

        response.put("message", "Se ha enviado un enlace con el token a su correo.");
        return ResponseEntity.ok(response);
    }



    // Paso 2: Validar el token
    // Paso 2: Validar el token
    @GetMapping("/restablecer-clave/validar-token/{token}")
    public ResponseEntity<Map<String, String>> validarToken(@PathVariable String token) {
        // Verifica si el token está presente
        System.out.println("Token recibido: " + token);

        // Verifica si el token existe en la base de datos
        Usuario usuario = usuarioService.findByTokenRecuperacion(token);
        if (usuario == null) {
            System.out.println("Token no encontrado.");
            Map<String, String> response = new HashMap<>();
            response.put("message", "El token es inválido o ha expirado.");
            return ResponseEntity.badRequest().body(response);
        }

        System.out.println("Fecha del token: " + usuario.getFechaTokenRecuperacion());

        // Verifica si la fecha de expiración del token es válida
        if (usuario.getFechaTokenRecuperacion().isBefore(LocalDateTime.now())) {
            System.out.println("El token ha expirado.");
            Map<String, String> response = new HashMap<>();
            response.put("message", "El token ha expirado.");
            return ResponseEntity.badRequest().body(response);
        }

        // Si el token es válido
        Map<String, String> response = new HashMap<>();
        response.put("message", "Token válido.");
        return ResponseEntity.ok(response);
    }



    // Paso 3: Restablecer la contraseña
    // Paso 3: Restablecer la contraseña
    @PostMapping("/restablecer-clave/{token}")
    public ResponseEntity<Map<String, String>> restablecerClave(@PathVariable String token, @RequestParam("nuevaClave") String nuevaClave) {
        Usuario usuario = usuarioService.findByTokenRecuperacion(token);

        if (usuario == null || usuario.getFechaTokenRecuperacion().isBefore(LocalDateTime.now())) {
            // Token inválido o expirado
            Map<String, String> response = new HashMap<>();
            response.put("message", "El token es inválido o ha expirado.");
            return ResponseEntity.badRequest().body(response);
        }

        // Validar que las contraseñas coincidan
        if (nuevaClave == null || nuevaClave.isEmpty()) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "La contraseña no puede estar vacía.");
            return ResponseEntity.badRequest().body(response);
        }

        // Actualizar la contraseña (encriptada)
        usuarioService.actualizarContraseña(usuario.getId(), nuevaClave);

        // Respuesta exitosa
        Map<String, String> response = new HashMap<>();
        response.put("message", "Contraseña actualizada correctamente.");
        return ResponseEntity.ok(response);
    }




    @Autowired
    private UsuarioService usuarioService;
    @Autowired
    private EmailService emailService; // Declarar la dependencia

    @PostMapping("/crear")
    public ResponseEntity<Usuario> crearUsuario(@RequestBody Usuario usuario) {
        Usuario nuevo = usuarioService.registrar(usuario);
        return ResponseEntity.ok(nuevo);
    }
    @PostMapping("/por-ids")
    public ResponseEntity<List<UsuarioNombreDTO>> obtenerPorIds(@RequestBody List<String> ids) {
        List<Long> idsLong = ids.stream()
                .map(Long::parseLong)
                .toList();

        List<Usuario> usuarios = usuarioService.obtenerPorIds(idsLong);

        List<UsuarioNombreDTO> result = usuarios.stream()
                .map(u -> new UsuarioNombreDTO(u.getId(), u.getNombre()))
                .toList();

        return ResponseEntity.ok(result);
    }

    @PostMapping("/registrar")
    public ResponseEntity<Usuario> registrarUsuario(@RequestBody Usuario usuario) {
        Usuario nuevo = usuarioService.registrar(usuario); // ya encripta contraseña
        return ResponseEntity.ok(nuevo);
    }
    @GetMapping("/check-correo")
    public ResponseEntity<Boolean> checkCorreo(@RequestParam String correo) {
        boolean exists = usuarioService.existsByCorreo(correo);
        return ResponseEntity.ok(exists);
    }
    @GetMapping("/check-dni")
    public ResponseEntity<Boolean> checkDni(@RequestParam String dni) {
        boolean exists = usuarioService.existsByDni(dni);
        return ResponseEntity.ok(exists);
    }
    @GetMapping
    public ResponseEntity<List<Usuario>> obtenerUsuarios() {
        return ResponseEntity.ok(usuarioService.obtenerTodos());
    }
    @GetMapping("/expedientes")
    public ResponseEntity<List<Usuario>> obtenerUsuariosExpedientes() {
        return ResponseEntity.ok(usuarioService.obtenerTodos());
    }

}