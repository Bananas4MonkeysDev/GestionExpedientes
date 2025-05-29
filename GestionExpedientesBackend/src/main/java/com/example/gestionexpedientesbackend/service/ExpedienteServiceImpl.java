package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.model.Expediente;
import com.example.gestionexpedientesbackend.repository.ExpedienteRepository;
import com.example.gestionexpedientesbackend.service.ExpedienteService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ExpedienteServiceImpl implements ExpedienteService {

    @Autowired
    private ExpedienteRepository expedienteRepository;

    @Transactional
    public Expediente registrarExpediente(Expediente expediente) {
        // Primero guardar sin código
        expediente = expedienteRepository.save(expediente);

        // Generar el código basado en el ID ya asignado
        String codigo = String.format("EXP-%06d", expediente.getId());
        expediente.setCodigo(codigo);

        // Volver a guardar con el código actualizado
        return expedienteRepository.save(expediente);
    }

}
