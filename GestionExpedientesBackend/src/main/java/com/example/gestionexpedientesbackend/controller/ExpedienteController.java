package com.example.gestionexpedientesbackend.controller;

import com.example.gestionexpedientesbackend.dto.ExpedienteDTO;
import com.example.gestionexpedientesbackend.dto.ExpedienteDetalleResponseDTO;
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
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/expedientes")
public class ExpedienteController {

    @Autowired
    private ExpedienteService expedienteService;
    @Autowired
    private DocumentoService documentoService;
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarExpediente(
            @PathVariable Long id,
            @RequestBody ExpedienteDTO datosActualizados) {

        try {
            expedienteService.actualizar(id, datosActualizados);
            return ResponseEntity.ok().body(Map.of("mensaje", "Expediente actualizado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Expediente no encontrado");
        }
    }
    @PutMapping("/documento/{id}")
    public ResponseEntity<?> actualizarDocumento(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {

        try {
            Documento documento = documentoService.obtenerPorId(id)
                    .orElseThrow(() -> new RuntimeException("Documento no encontrado"));

            if (updates.containsKey("tipoDocumento")) {
                documento.setTipoDocumento((String) updates.get("tipoDocumento"));
            }
            if (updates.containsKey("visibleParaExternos")) {
                documento.setVisibleParaExternos((Boolean) updates.get("visibleParaExternos"));
            }
            documentoService.actualizarDocumento(documento);
            return ResponseEntity.ok(Map.of("mensaje", "Documento actualizado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Documento no encontrado");
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarDocumento(@PathVariable Long id) {
        try {
            documentoService.eliminarPorId(id);
            return ResponseEntity.ok(Map.of("mensaje", "Documento eliminado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Documento no encontrado");
        }
    }


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
    @GetMapping("/{id}/detalle")
    public ResponseEntity<ExpedienteDetalleResponseDTO> obtenerDetalle(@PathVariable Long id) {
        ExpedienteDetalleResponseDTO detalle = expedienteService.obtenerDetalleExpediente(id);
        if (detalle == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(detalle);
    }
}

