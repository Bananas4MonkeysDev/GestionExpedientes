package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.model.Proyecto;
import com.example.gestionexpedientesbackend.repository.ProyectoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProyectoServiceImpl implements ProyectoService {

    @Autowired
    private ProyectoRepository proyectoRepository;

    @Override
    public List<Proyecto> listar() {
        return proyectoRepository.findAll();
    }

    @Override
    public Proyecto obtenerPorId(Long id) {
        return proyectoRepository.findById(id).orElse(null);
    }

    @Override
    public Proyecto guardar(Proyecto proyecto) {
        return proyectoRepository.save(proyecto);
    }

    @Override
    public Proyecto actualizar(Proyecto proyecto) {
        return proyectoRepository.save(proyecto);
    }

    @Override
    public void eliminar(Long id) {
        proyectoRepository.deleteById(id);
    }
}
