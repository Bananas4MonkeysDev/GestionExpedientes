package com.example.gestionexpedientesbackend.controller;

import com.example.gestionexpedientesbackend.dto.FlujoProcesoRequest;
import com.example.gestionexpedientesbackend.model.FlujoProceso;
import com.example.gestionexpedientesbackend.service.FlujoProcesoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/flujo-proceso")
public class FlujoProcesoController {

    @Autowired
    private FlujoProcesoService flujoProcesoService;

    @PostMapping("/registrar")
    public ResponseEntity<FlujoProceso> registrar(@RequestBody FlujoProcesoRequest request) {
        System.out.println("[DEBUG BACKEND] Petición recibida en /api/flujo-proceso/registrar");
        System.out.println("[DEBUG BACKEND] Datos recibidos: " + request);
        FlujoProceso creado = flujoProcesoService.registrarFlujo(request);
        return ResponseEntity.ok(creado);
    }
    @GetMapping("/por-expediente/{id}")
    public ResponseEntity<List<FlujoProceso>> obtenerPorExpediente(@PathVariable Long id) {
        List<FlujoProceso> flujos = flujoProcesoService.obtenerPorExpediente(id);
        return ResponseEntity.ok(flujos);
    }
    @PutMapping("/actualizar/{id}")
    public ResponseEntity<FlujoProceso> actualizarFlujo(@PathVariable Long id, @RequestBody FlujoProcesoRequest request) {
        FlujoProceso actualizado = flujoProcesoService.actualizarFlujo(id, request);
        return ResponseEntity.ok(actualizado);
    }
    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<?> eliminarFlujo(@PathVariable Long id) {
        flujoProcesoService.eliminarFlujo(id);
        return ResponseEntity.ok().build();
    }
    @PostMapping("/firmar/{flujoId}/{documentoId}/{usuarioId}")
    public ResponseEntity<Map<String, String>> firmarDocumento(
            @PathVariable Long flujoId,
            @PathVariable Long documentoId,
            @PathVariable Long usuarioId) {
        try {
            flujoProcesoService.firmarDocumento(flujoId, documentoId, usuarioId);

            Map<String, String> respuesta = new HashMap<>();
            respuesta.put("mensaje", "Documento firmado exitosamente");

            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("mensaje", "Error al firmar documento: " + e.getMessage());

            return ResponseEntity.status(500).body(error);
        }
    }
    @DeleteMapping("/observar/{flujoId}")
    public ResponseEntity<Void> observarYEliminarNivel(
            @PathVariable Long flujoId,
            @RequestParam String comentario) {
        flujoProcesoService.observarYEliminarNivel(flujoId, comentario);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/firma/estado")
    public ResponseEntity<Map<String, Object>> obtenerEstadoFirma(
            @RequestParam Long flujoId,
            @RequestParam Long usuarioId,
            @RequestParam(required = false) Long documentoId) {

        Optional<FlujoProceso> flujoOpt = flujoProcesoService.obtenerPorId(flujoId);

        if (flujoOpt.isEmpty()) return ResponseEntity.notFound().build();

        FlujoProceso flujo = flujoOpt.get();

        List<Long> usuarios = Arrays.stream(flujo.getUsuarios().split("\\|"))
                .map(Long::parseLong)
                .collect(Collectors.toList());

        List<Long> firmantes = flujo.getUsuariosFirmantes() == null || flujo.getUsuariosFirmantes().isBlank()
                ? new ArrayList<>()
                : Arrays.stream(flujo.getUsuariosFirmantes().split("\\|"))
                .map(Long::parseLong)
                .collect(Collectors.toList());

        boolean yaFirmo = firmantes.contains(usuarioId);

        Map<String, Object> result = new HashMap<>();
        result.put("yaFirmo", yaFirmo);
        result.put("usuariosTotales", usuarios.size());
        result.put("firmantesTotales", firmantes.size());

        // 🔍 Caso tipo GENERAL → verificar documento firmado también
        if ("General".equalsIgnoreCase(flujo.getTipoNivel()) && documentoId != null) {
            List<Long> documentosFirmados = flujo.getDocumentosFirmados() == null || flujo.getDocumentosFirmados().isBlank()
                    ? new ArrayList<>()
                    : Arrays.stream(flujo.getDocumentosFirmados().split("\\|"))
                    .map(Long::parseLong)
                    .collect(Collectors.toList());

            boolean docYaFirmado = documentosFirmados.contains(documentoId);
            boolean mostrarBoton = usuarios.contains(usuarioId) && !yaFirmo && !docYaFirmado;

            result.put("yaFirmo", yaFirmo);
            result.put("docYaFirmado", docYaFirmado);
            result.put("mostrarBoton", mostrarBoton);
            result.put("tipo", "General");

        } else {
            // 🔍 Tipo Específico
            boolean mostrarBoton = usuarios.contains(usuarioId) && !yaFirmo;

            result.put("yaFirmo", yaFirmo);
            result.put("docYaFirmado", false); // No aplica
            result.put("mostrarBoton", mostrarBoton);
            result.put("tipo", "Especifico");
        }
        return ResponseEntity.ok(result);
    }

}