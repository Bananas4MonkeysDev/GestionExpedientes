package com.example.gestionexpedientesbackend.repository;

import com.example.gestionexpedientesbackend.model.Documento;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentoRepository extends JpaRepository<Documento, Long> {
}
