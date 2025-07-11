package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.dto.ExpedienteDTO;
import com.example.gestionexpedientesbackend.dto.ExpedienteDetalleResponseDTO;
import com.example.gestionexpedientesbackend.model.Expediente;

import java.util.List;
import java.util.Optional;

public interface ExpedienteService {
    Expediente registrarExpediente(Expediente expediente);
    Optional<Expediente> obtenerPorId(Long id);
    void cambiarEstado(Long id, String nuevoEstado);

    ExpedienteDetalleResponseDTO obtenerDetalleExpediente(Long id);
    void actualizar(Long id, ExpedienteDTO datosActualizados);
   void notificarRegistroExpediente(Long expedienteId, boolean conDocumentos);
    List<Expediente> obtenerTodos();
    List<Expediente> obtenerPorUsuario(Long usuarioId);
    void marcarComoLeido(Long id);
    void archivarExpediente(Long id);
    void marcarComoDesechado(Long id);
    void cambiarEstadoConFecha(Long id, String estado, String fechaLimite) throws Exception;
    List<Expediente> obtenerPorIds(List<Long> ids);

}
