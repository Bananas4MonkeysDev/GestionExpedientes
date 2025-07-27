package com.example.gestionexpedientesbackend.controller;

import com.example.gestionexpedientesbackend.dto.FlujoProcesoRequest;
import com.example.gestionexpedientesbackend.model.FlujoProceso;
import com.example.gestionexpedientesbackend.service.FlujoProcesoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

}