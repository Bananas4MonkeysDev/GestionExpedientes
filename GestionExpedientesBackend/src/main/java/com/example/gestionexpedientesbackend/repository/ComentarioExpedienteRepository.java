package com.example.gestionexpedientesbackend.repository;

import com.example.gestionexpedientesbackend.model.ComentarioExpediente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComentarioExpedienteRepository extends JpaRepository<ComentarioExpediente, Long> {
    List<ComentarioExpediente> findByExpedienteId(Long expedienteId);
}
