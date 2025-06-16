package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.model.GrupoArea;

import java.util.List;
import java.util.Optional;

public interface GrupoAreaService {
    List<GrupoArea> listar();
    GrupoArea crear(GrupoArea grupoArea);
    GrupoArea actualizar(Long id, GrupoArea grupoArea);
    void eliminar(Long id);
    GrupoArea obtenerPorId(Long id);
    List<GrupoArea> buscarGruposAreasPorUsuarioId(Long usuarioId);

}