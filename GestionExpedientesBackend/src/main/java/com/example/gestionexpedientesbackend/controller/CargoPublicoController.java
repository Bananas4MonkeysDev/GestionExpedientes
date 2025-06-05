package com.example.gestionexpedientesbackend.controller;

import com.example.gestionexpedientesbackend.model.Cargo;
import com.example.gestionexpedientesbackend.service.CargoService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.File;

@RestController
@RequestMapping("/api/public/cargo")
public class CargoPublicoController {

    private final CargoService cargoService;

    public CargoPublicoController(CargoService cargoService) {
        this.cargoService = cargoService;
    }
    @GetMapping("/uuid/{uuid}")
    public ResponseEntity<Cargo> obtenerPorUuid(@PathVariable String uuid) {
        Cargo cargo = cargoService.obtenerPorUuid(uuid); // ✅ usa el servicio, no el repositorio directo
        return cargo != null ? ResponseEntity.ok(cargo) : ResponseEntity.notFound().build();
    }

    // Endpoint para obtener los datos del cargo por ID (sin login)
    @GetMapping("/{id}")
    public ResponseEntity<Cargo> obtenerCargo(@PathVariable Long id) {
        Cargo cargo = cargoService.obtenerPorId(id);
        return cargo != null ? ResponseEntity.ok(cargo) : ResponseEntity.notFound().build();
    }

    // Endpoint para descargar archivo (si existe)
    @GetMapping("/uuid/{uuid}/descargar")
    public ResponseEntity<Resource> descargarArchivoPorUuid(@PathVariable String uuid) {
        Cargo cargo = cargoService.obtenerPorUuid(uuid);
        if (cargo == null || cargo.getArchivoPath() == null) {
            return ResponseEntity.notFound().build();
        }

        File archivo = new File(cargo.getArchivoPath());
        if (!archivo.exists()) return ResponseEntity.notFound().build();

        Resource resource = new FileSystemResource(archivo);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + archivo.getName() + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }

}
