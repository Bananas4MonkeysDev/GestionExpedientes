package com.example.gestionexpedientesbackend.controller;

import com.example.gestionexpedientesbackend.dto.FlujoProcesoRequest;
import com.example.gestionexpedientesbackend.model.FlujoProceso;
import com.example.gestionexpedientesbackend.service.FlujoProcesoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

}