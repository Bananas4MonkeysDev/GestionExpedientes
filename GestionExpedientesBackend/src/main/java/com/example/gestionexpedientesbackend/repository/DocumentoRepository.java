package com.example.gestionexpedientesbackend.repository;

import com.example.gestionexpedientesbackend.model.Documento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentoRepository extends JpaRepository<Documento, Long> {
    List<Documento> findByExpedienteId(Long expedienteId);

}
