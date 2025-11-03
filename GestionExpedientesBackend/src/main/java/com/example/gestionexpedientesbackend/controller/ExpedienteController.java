package com.example.gestionexpedientesbackend.controller;

import com.example.gestionexpedientesbackend.dto.EstadoExpedienteDTO;
import com.example.gestionexpedientesbackend.dto.ExpedienteDTO;
import com.example.gestionexpedientesbackend.dto.ExpedienteDetalleResponseDTO;
import com.example.gestionexpedientesbackend.dto.FlujoProcesoRequest;
import com.example.gestionexpedientesbackend.model.Documento;
import com.example.gestionexpedientesbackend.model.Expediente;
import com.example.gestionexpedientesbackend.model.FlujoProceso;
import com.example.gestionexpedientesbackend.service.DocumentoService;
import com.example.gestionexpedientesbackend.service.ExpedienteService;
import com.example.gestionexpedientesbackend.service.FlujoProcesoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.*;

@RestController
@RequestMapping("/api/expedientes")
public class ExpedienteController {

    @Autowired
    private ExpedienteService expedienteService;
    @Autowired
    private DocumentoService documentoService;
    @Autowired
    private FlujoProcesoService flujoProcesoService;
    @GetMapping("/asignados-por-firma/{usuarioId}")
    public ResponseEntity<List<Expediente>> obtenerExpedientesAsignadosPorFirma(@PathVariable Long usuarioId) {
        List<Long> ids = flujoProcesoService.obtenerExpedientesIdPorUsuarioFirmante(usuarioId.toString());
        List<Expediente> expedientes = expedienteService.obtenerPorIds(ids); // Este método lo agregamos a continuación
        return ResponseEntity.ok(expedientes);
    }
    @GetMapping("/asignados-condicionados/{usuarioId}")
    public ResponseEntity<List<Expediente>> obtenerExpedientesAsignadosCondicionados(@PathVariable Long usuarioId) {
        List<Long> ids = flujoProcesoService.obtenerExpedientesIdPorUsuarioFirmanteCondicionado(usuarioId);
        List<Expediente> expedientes = expedienteService.obtenerPorIds(ids);
        return ResponseEntity.ok(expedientes);
    }
    @GetMapping("/{expedienteId}/documentos-firmables")
    public ResponseEntity<List<Documento>> obtenerDocumentosFirmables(
            @PathVariable Long expedienteId,
            @RequestParam Long usuarioId) {
        return ResponseEntity.ok(
                flujoProcesoService.obtenerDocumentosPendientesParaFirmar(expedienteId, usuarioId)
        );
    }
    @PostMapping("/documentos/listar-pdfs")
    public ResponseEntity<?> listarPdfs(@RequestBody Map<String, String> body) throws IOException {
        String ruta = body.get("ruta");

        File carpeta = new File(ruta);
        if (!carpeta.exists() || !carpeta.isDirectory()) {
            return ResponseEntity.badRequest().body("Ruta no válida o inaccesible.");
        }

        List<Map<String, String>> pdfs = new ArrayList<>();
        for (File file : Objects.requireNonNull(carpeta.listFiles())) {
            if (file.getName().toLowerCase().endsWith(".pdf")) {
                byte[] bytes = Files.readAllBytes(file.toPath());
                String base64 = Base64.getEncoder().encodeToString(bytes);
                Map<String, String> pdf = new HashMap<>();
                pdf.put("nombre", file.getName());
                pdf.put("base64", base64);
                pdfs.add(pdf);
            }
        }

        return ResponseEntity.ok(pdfs);
    }

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
    @PutMapping("/{id}/estado/simple")
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
        System.out.println("[DEBUG] usuarioCreadorId recibido: " + expediente.getCreadoPor());

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
    @PutMapping("/{id}/marcar-leido")
    public ResponseEntity<Void> marcarComoLeido(@PathVariable Long id) {
        expedienteService.marcarComoLeido(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/archivar")
    public ResponseEntity<Void> archivarExpediente(@PathVariable Long id) {
        expedienteService.archivarExpediente(id);
        return ResponseEntity.ok().build();
    }
    @PutMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstadoConFecha(
            @PathVariable Long id,
            @RequestBody EstadoExpedienteDTO dto
    ) {
        try {
            expedienteService.cambiarEstadoConFecha(id, dto.getEstado(), dto.getFechaLimite());
            return ResponseEntity.ok(Map.of("mensaje", "Estado actualizado"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/expedientes/{id}/desechar")
    public ResponseEntity<?> marcarComoDesechado(@PathVariable Long id) {
        expedienteService.marcarComoDesechado(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/detalle")
    public ResponseEntity<ExpedienteDetalleResponseDTO> obtenerDetalle(@PathVariable Long id) {
        ExpedienteDetalleResponseDTO detalle = expedienteService.obtenerDetalleExpediente(id);
        if (detalle == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(detalle);
    }
    @PostMapping("/{id}/documento-por-ruta")
    public ResponseEntity<?> registrarDocumentoPorRuta(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        try {
            String nombreArchivo = (String) body.get("nombreArchivo");
            String rutaArchivo = (String) body.get("rutaArchivo");
            String tipoDocumento = (String) body.getOrDefault("tipoDocumento", "PDF");
            boolean visible = (boolean) body.getOrDefault("visibleParaExternos", false);
            Long tamaño = body.get("tamaño") != null
                    ? ((Number) body.get("tamaño")).longValue()
                    : 0L;

            Documento guardado = documentoService.guardarDocumentoPorRuta(
                    nombreArchivo, rutaArchivo, tipoDocumento, visible, tamaño, id
            );

            return ResponseEntity.ok(guardado);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al registrar documento por ruta: " + e.getMessage());
        }
    }

}

