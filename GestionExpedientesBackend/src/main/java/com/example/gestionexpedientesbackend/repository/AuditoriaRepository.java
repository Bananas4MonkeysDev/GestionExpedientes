package com.example.gestionexpedientesbackend.repository;

import com.example.gestionexpedientesbackend.model.Auditoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    List<Auditoria> findByExpedienteId(Long expedienteId);

}
