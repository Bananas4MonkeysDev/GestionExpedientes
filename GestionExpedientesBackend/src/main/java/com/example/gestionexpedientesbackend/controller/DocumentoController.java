package com.example.gestionexpedientesbackend.controller;

import com.example.gestionexpedientesbackend.model.Documento;
import com.example.gestionexpedientesbackend.service.DocumentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/documentos")
public class DocumentoController {
    @Autowired
    private DocumentoService documentoService;

    @GetMapping("/por-ids")
    public List<Documento> obtenerPorIds(@RequestParam String ids) {
        return documentoService.obtenerPorIdsSeparados(ids);
    }

}
