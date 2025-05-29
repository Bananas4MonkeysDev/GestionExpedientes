package com.example.gestionexpedientesbackend.controller;

import com.example.gestionexpedientesbackend.dto.ReferenciaDTO;
import com.example.gestionexpedientesbackend.repository.DocumentoRepository;
import com.example.gestionexpedientesbackend.repository.ExpedienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/referencias")
public class ReferenciaController {

    @Autowired
    private ExpedienteRepository expedienteRepo;

    @Autowired
    private DocumentoRepository documentoRepo;

    @GetMapping
    public List<ReferenciaDTO> obtenerReferencias() {
        List<ReferenciaDTO> referencias = new ArrayList<>();

        expedienteRepo.findAll().forEach(exp -> {
            ReferenciaDTO dto = new ReferenciaDTO();
            dto.setTipo("Expediente");
            dto.setId(exp.getId());
            dto.setSerie(exp.getCodigo());
            dto.setAsunto(exp.getAsunto());
            referencias.add(dto);
        });

        documentoRepo.findAll().forEach(doc -> {
            ReferenciaDTO dto = new ReferenciaDTO();
            dto.setTipo("Documento");
            dto.setId(doc.getId());
            dto.setSerie(doc.getCodigo());
            dto.setAsunto(doc.getNombreArchivo());
            referencias.add(dto);
        });

        return referencias;
    }
}
