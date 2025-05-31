package com.example.gestionexpedientesbackend.service;
import com.example.gestionexpedientesbackend.model.Usuario;

import java.util.List;

public interface UsuarioService {
    Usuario registrar(Usuario usuario);
    List<Usuario> obtenerTodos();

    Usuario login(String correo, String contraseña);
    public boolean existsByCorreo(String correo);
    public boolean existsByDni(String dni);
    List<Usuario> obtenerPorIdsSeparados(String idsSeparadosPorPipe);

}
