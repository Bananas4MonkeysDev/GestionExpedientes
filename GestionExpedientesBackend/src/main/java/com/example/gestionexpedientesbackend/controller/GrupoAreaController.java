package com.example.gestionexpedientesbackend.controller;


import com.example.gestionexpedientesbackend.model.GrupoArea;
import com.example.gestionexpedientesbackend.service.GrupoAreaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grupos-areas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GrupoAreaController {

    private final GrupoAreaService service;

    @GetMapping
    public List<GrupoArea> listar() {
        return service.listar();
    }

    @PostMapping
    public GrupoArea crear(@RequestBody GrupoArea grupoArea) {
        return service.crear(grupoArea);
    }

    @PutMapping("/{id}")
    public GrupoArea actualizar(@PathVariable Long id, @RequestBody GrupoArea grupoArea) {
        return service.actualizar(id, grupoArea);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        service.eliminar(id);
    }

    @GetMapping("/{id}")
    public GrupoArea obtener(@PathVariable Long id) {
        return service.obtenerPorId(id);
    }
}