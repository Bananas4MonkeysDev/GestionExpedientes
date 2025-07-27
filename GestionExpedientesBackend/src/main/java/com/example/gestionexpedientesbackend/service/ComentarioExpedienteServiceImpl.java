package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.dto.ComentarioExpedienteDTO;
import com.example.gestionexpedientesbackend.model.ComentarioExpediente;
import com.example.gestionexpedientesbackend.model.Expediente;
import com.example.gestionexpedientesbackend.model.Usuario;
import com.example.gestionexpedientesbackend.repository.ComentarioExpedienteRepository;
import com.example.gestionexpedientesbackend.repository.ExpedienteRepository;
import com.example.gestionexpedientesbackend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ComentarioExpedienteServiceImpl implements ComentarioExpedienteService {

    @Autowired
    private ComentarioExpedienteRepository comentarioRepo;

    @Autowired
    private ExpedienteRepository expedienteRepo;

    @Autowired
    private UsuarioRepository usuarioRepo;

    @Override
    public void guardarComentario(ComentarioExpedienteDTO dto) {
        ComentarioExpediente comentario = new ComentarioExpediente();
        comentario.setComentario(dto.getComentario());
        comentario.setFechaHora(dto.getFechaHora());

        Expediente expediente = expedienteRepo.findById(dto.getExpedienteId())
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado"));
        Usuario usuario = usuarioRepo.findById(dto.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        comentario.setExpediente(expediente);
        comentario.setUsuario(usuario);

        comentarioRepo.save(comentario);
    }
}
