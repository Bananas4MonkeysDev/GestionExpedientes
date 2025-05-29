package com.example.gestionexpedientesbackend.controller;

import com.example.gestionexpedientesbackend.model.Documento;
import com.example.gestionexpedientesbackend.model.Expediente;
import com.example.gestionexpedientesbackend.service.DocumentoService;
import com.example.gestionexpedientesbackend.service.ExpedienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/expedientes")
public class ExpedienteController {

    @Autowired
    private ExpedienteService expedienteService;
    @Autowired
    private DocumentoService documentoService;

    @PostMapping("/registrar")
    public ResponseEntity<Expediente> registrar(@RequestBody Expediente expediente) {
        Expediente creado = expedienteService.registrarExpediente(expediente);
        return ResponseEntity.ok(creado);
    }
    @PostMapping("/{id}/documento")
    public ResponseEntity<?> subirDocumento(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("tipoDocumento") String tipoDocumento,
            @RequestParam("visibleParaExternos") boolean visible,
            @RequestParam("tamaño") Long tamaño
    ) {
        try {
            Documento guardado = documentoService.guardarDocumento(file, id, tipoDocumento, visible);
            return ResponseEntity.ok(guardado);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al guardar el archivo");
        }
    }

}

