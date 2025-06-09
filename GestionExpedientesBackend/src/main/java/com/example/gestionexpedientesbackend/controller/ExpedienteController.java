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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    @PostMapping("/notificar-expediente/{id}")
    public ResponseEntity<Void> notificarRegistro(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean conDocumentos) {
        expedienteService.notificarRegistroExpediente(id, conDocumentos);
        return ResponseEntity.ok().build();
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
    @PutMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstadoExpediente(
            @PathVariable Long id,
            @RequestParam("estado") String estado) {
        try {
            // Validación opcional de estado permitido
            List<String> estadosValidos = List.of("PENDIENTE", "APROBADO", "RECHAZADO", "ANULADO");
            if (!estadosValidos.contains(estado.toUpperCase())) {
                return ResponseEntity.badRequest().body("Estado no válido: " + estado);
            }

            expedienteService.cambiarEstado(id, estado.toUpperCase());
            return ResponseEntity.ok(Map.of("mensaje", "Estado actualizado a " + estado));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Expediente no encontrado");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al cambiar el estado");
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
        System.out.println("========= [BACKEND] Subida de documento =========");
        System.out.println("→ ID de expediente: " + id);
        System.out.println("→ Nombre del archivo: " + file.getOriginalFilename());
        System.out.println("→ Tipo documento: " + tipoDocumento);
        System.out.println("→ Visible para externos: " + visible);
        System.out.println("→ Tamaño recibido (param): " + tamaño);
        System.out.println("→ Tamaño archivo (real): " + file.getSize());
        System.out.println("→ Tipo MIME: " + file.getContentType());
        System.out.println("==================================================");

        try {
            Documento guardado = documentoService.guardarDocumento(file, id, tipoDocumento, visible);
            System.out.println("✔ Documento guardado correctamente.");
            return ResponseEntity.ok(guardado);
        } catch (IOException e) {
            System.err.println("✖ Error al guardar el archivo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al guardar el archivo");
        }
    }
    @GetMapping
    public ResponseEntity<List<Expediente>> obtenerTodos() {
        return ResponseEntity.ok(expedienteService.obtenerTodos());
    }

    @GetMapping("/por-usuario/{id}")
    public ResponseEntity<List<Expediente>> obtenerPorUsuario(@PathVariable Long id) {
        return ResponseEntity.ok(expedienteService.obtenerPorUsuario(id));
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

