package com.example.gestionexpedientesbackend.controller;

import com.example.gestionexpedientesbackend.model.Proyecto;
import com.example.gestionexpedientesbackend.service.ProyectoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/proyectos")
@CrossOrigin(origins = "*")
public class ProyectoController {

    @Autowired
    private ProyectoService proyectoService;

    @GetMapping
    public List<Proyecto> listar() {
        return proyectoService.listar();
    }

    @GetMapping("/{id}")
    public Proyecto obtener(@PathVariable Long id) {
        return proyectoService.obtenerPorId(id);
    }

    @PostMapping
    public Proyecto crear(@RequestBody Proyecto proyecto) {
        return proyectoService.guardar(proyecto);
    }

    @PutMapping("/{id}")
    public Proyecto actualizar(@PathVariable Long id, @RequestBody Proyecto proyecto) {
        proyecto.setId(id);
        return proyectoService.actualizar(proyecto);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        proyectoService.eliminar(id);
    }
}
