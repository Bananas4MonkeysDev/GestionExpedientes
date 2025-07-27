package com.example.gestionexpedientesbackend.controller;

import com.example.gestionexpedientesbackend.dto.ComentarioExpedienteDTO;
import com.example.gestionexpedientesbackend.service.ComentarioExpedienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/expedientes/comentarios")
@CrossOrigin
public class ComentarioExpedienteController {

    @Autowired
    private ComentarioExpedienteService comentarioService;

    @PostMapping
    public ResponseEntity<?> registrarComentario(@RequestBody ComentarioExpedienteDTO dto) {
        comentarioService.guardarComentario(dto);
        return ResponseEntity.ok().build();
    }
}
