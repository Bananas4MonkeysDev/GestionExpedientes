package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.model.Proyecto;

import java.util.List;

public interface ProyectoService {
    List<Proyecto> listar();
    Proyecto obtenerPorId(Long id);
    Proyecto guardar(Proyecto proyecto);
    Proyecto actualizar(Proyecto proyecto);
    void eliminar(Long id);
}
