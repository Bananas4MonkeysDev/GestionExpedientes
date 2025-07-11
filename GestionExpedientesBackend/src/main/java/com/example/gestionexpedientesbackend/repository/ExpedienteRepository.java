package com.example.gestionexpedientesbackend.repository;

import com.example.gestionexpedientesbackend.model.Expediente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpedienteRepository extends JpaRepository<Expediente, Long> {
    List<Expediente> findByUsuariosDestinatariosContainingAndTipoExpediente(String usuarioId, String tipoExpediente);

}

