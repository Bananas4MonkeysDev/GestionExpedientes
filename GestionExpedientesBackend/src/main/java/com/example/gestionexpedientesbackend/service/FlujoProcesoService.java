package com.example.gestionexpedientesbackend.service;


import com.example.gestionexpedientesbackend.dto.FlujoProcesoRequest;
import com.example.gestionexpedientesbackend.model.Documento;
import com.example.gestionexpedientesbackend.model.Expediente;
import com.example.gestionexpedientesbackend.model.FlujoProceso;

import java.util.List;

public interface FlujoProcesoService {
    FlujoProceso registrarFlujo(FlujoProcesoRequest request);
    List<Long> obtenerExpedientesIdPorUsuarioFirmante(String usuarioId);
    List<Long> obtenerExpedientesIdPorUsuarioFirmanteCondicionado(Long usuarioId);
    List<Documento> obtenerDocumentosPendientesParaFirmar(Long expedienteId, Long usuarioId);

}
