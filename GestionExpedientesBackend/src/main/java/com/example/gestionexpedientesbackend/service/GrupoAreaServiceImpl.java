package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.model.GrupoArea;
import com.example.gestionexpedientesbackend.repository.GrupoAreaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GrupoAreaServiceImpl implements GrupoAreaService {

    private final GrupoAreaRepository repository;

    @Override
    public List<GrupoArea> listar() {
        return repository.findAll();
    }

    @Override
    public GrupoArea crear(GrupoArea grupoArea) {
        return repository.save(grupoArea);
    }

    @Override
    public GrupoArea actualizar(Long id, GrupoArea grupoArea) {
        grupoArea.setId(id);
        return repository.save(grupoArea);
    }

    @Override
    public void eliminar(Long id) {
        repository.deleteById(id);
    }

    @Override
    public GrupoArea obtenerPorId(Long id) {
        return repository.findById(id).orElse(null);
    }
    @Override
    public List<GrupoArea> buscarGruposAreasPorUsuarioId(Long usuarioId) {
        String patron = "|" + usuarioId + "|";
        return repository.buscarTodosPorUsuarioId(patron);
    }

}