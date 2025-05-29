package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.model.Documento;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface DocumentoService {
    Documento guardarDocumento(MultipartFile file, Long expedienteId, String tipoDocumento, boolean visible) throws IOException;
}
