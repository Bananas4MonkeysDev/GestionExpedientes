package com.example.gestionexpedientesbackend.security;

import com.example.gestionexpedientesbackend.model.Usuario;
import com.example.gestionexpedientesbackend.repository.UsuarioRepository;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
    @Autowired
    private UsuarioRepository usuarioRepository;

    private static final String SECRET = "claveSuperSegura2025!claveSuperSegura2025!";
    private static final long EXPIRATION = 1000 * 60 * 60 * 4;

    private final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());

    public String generateToken(String username) {
        Usuario usuario = usuarioRepository.findByCorreo(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return Jwts.builder()
                .setSubject(username)
                .claim("id", usuario.getId())
                .claim("correo", usuario.getCorreo())
                .claim("nombre", usuario.getNombre())
                .claim("rol", usuario.getRol())
                .claim("tipoIdentidad", usuario.getTipoIdentidad().toString())
                .claim("tipoUsuario", usuario.getTipoUsuario().toString())
                .claim("dni", usuario.getDni())
                .claim("ruc", usuario.getRuc())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }


    public String extractUsername(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            extractUsername(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}
