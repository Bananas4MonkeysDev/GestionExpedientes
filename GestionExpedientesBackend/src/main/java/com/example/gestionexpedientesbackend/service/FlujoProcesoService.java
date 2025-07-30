package com.example.gestionexpedientesbackend.service;


import com.example.gestionexpedientesbackend.dto.FlujoProcesoRequest;
import com.example.gestionexpedientesbackend.model.Documento;
import com.example.gestionexpedientesbackend.model.Expediente;
import com.example.gestionexpedientesbackend.model.FlujoProceso;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public interface FlujoProcesoService {
    FlujoProceso registrarFlujo(FlujoProcesoRequest request);
    List<Long> obtenerExpedientesIdPorUsuarioFirmante(String usuarioId);
    List<Long> obtenerExpedientesIdPorUsuarioFirmanteCondicionado(Long usuarioId);
    List<Documento> obtenerDocumentosPendientesParaFirmar(Long expedienteId, Long usuarioId);
    List<FlujoProceso> obtenerPorExpediente(Long expedienteId);
    FlujoProceso actualizarFlujo(Long id, FlujoProcesoRequest request);
    void eliminarFlujo(Long id);
    Optional<FlujoProceso> obtenerPorId(Long id);

    void firmarDocumento(Long flujoId, Long documentoId, Long usuarioId) throws IOException;
    void observarYEliminarNivel(Long flujoId, String comentario);

}
