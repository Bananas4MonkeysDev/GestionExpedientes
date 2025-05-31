package com.example.gestionexpedientesbackend.controller;

import com.example.gestionexpedientesbackend.model.Usuario;
import com.example.gestionexpedientesbackend.dto.UsuarioLoginDTO;
import com.example.gestionexpedientesbackend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;
    @PostMapping("/crear")
    public ResponseEntity<Usuario> crearUsuario(@RequestBody Usuario usuario) {
        Usuario nuevo = usuarioService.registrar(usuario);
        return ResponseEntity.ok(nuevo);
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

}