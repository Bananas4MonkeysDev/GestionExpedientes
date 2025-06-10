package com.example.gestionexpedientesbackend.controller;

import com.example.gestionexpedientesbackend.model.Auditoria;
import com.example.gestionexpedientesbackend.repository.AuditoriaRepository;
import com.example.gestionexpedientesbackend.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
@CrossOrigin(origins = "*")
public class AuditoriaController {

    @Autowired
    private AuditoriaService auditoriaService;
    @Autowired
    AuditoriaRepository auditoriaRepository;
    @PostMapping("/registrar")
    public ResponseEntity<Auditoria> registrarAuditoria(@RequestBody Auditoria auditoria) {
        Auditoria creada = auditoriaService.registrarAuditoria(auditoria);
        return ResponseEntity.ok(creada);
    }
    @GetMapping("/por-expediente/{expedienteId}")
    public ResponseEntity<List<Auditoria>> obtenerPorExpediente(@PathVariable Long expedienteId) {
        List<Auditoria> auditorias = auditoriaRepository.findByExpedienteId(expedienteId);
        return ResponseEntity.ok(auditorias);
    }

}
