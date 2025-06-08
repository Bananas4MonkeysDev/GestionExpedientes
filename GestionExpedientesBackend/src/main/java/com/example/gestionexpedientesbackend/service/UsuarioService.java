package com.example.gestionexpedientesbackend.service;
import com.example.gestionexpedientesbackend.model.Usuario;

import java.util.List;

public interface UsuarioService {
    Usuario registrar(Usuario usuario);
    List<Usuario> obtenerTodos();
    void enviarCorreoRecuperacion(String correo, String token);

    Usuario findByTokenRecuperacion(String token);
    void guardarTokenRecuperacion(Long usuarioId, String token);

    List<Usuario> obtenerPorIds(List<Long> ids);

    void actualizarContraseña(Long usuarioId, String nuevaClave);
    Usuario findByCorreo(String correo);

    Usuario login(String correo, String contraseña);
    public boolean existsByCorreo(String correo);
    public boolean existsByDni(String dni);
    List<Usuario> obtenerPorIdsSeparados(String idsSeparadosPorPipe);

}
