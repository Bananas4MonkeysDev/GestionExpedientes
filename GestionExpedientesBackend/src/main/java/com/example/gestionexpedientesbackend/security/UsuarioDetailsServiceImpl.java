package com.example.gestionexpedientesbackend.security;

import com.example.gestionexpedientesbackend.model.Usuario;
import com.example.gestionexpedientesbackend.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Collections;
import lombok.extern.slf4j.Slf4j;
@Slf4j

@Service
public class UsuarioDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String correo) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
        log.info("Contraseña en BD: {}", usuario.getContraseña());

        return new User(
                usuario.getCorreo(),
                usuario.getContraseña(),  // aquí debe ir la contraseña encriptada
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + usuario.getRol().toUpperCase()))
        );
    }


}
