package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.model.Documento;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public interface DocumentoService {
    Documento guardarDocumento(MultipartFile file, Long expedienteId, String tipoDocumento, boolean visible) throws IOException;
    List<Documento> obtenerPorExpedienteId(Long expedienteId);
    Optional<Documento> obtenerPorId(Long id);
    Documento actualizarDocumento(Documento documento);

    void eliminarPorId(Long id);

}
