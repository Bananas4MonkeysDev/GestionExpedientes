package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.dto.ExpedienteDTO;
import com.example.gestionexpedientesbackend.dto.ExpedienteDetalleResponseDTO;
import com.example.gestionexpedientesbackend.model.Expediente;

import java.util.List;
import java.util.Optional;

public interface ExpedienteService {
    Expediente registrarExpediente(Expediente expediente);
    Optional<Expediente> obtenerPorId(Long id);

    ExpedienteDetalleResponseDTO obtenerDetalleExpediente(Long id);
    void actualizar(Long id, ExpedienteDTO datosActualizados);
   void notificarRegistroExpediente(Long expedienteId, boolean conDocumentos);

}
