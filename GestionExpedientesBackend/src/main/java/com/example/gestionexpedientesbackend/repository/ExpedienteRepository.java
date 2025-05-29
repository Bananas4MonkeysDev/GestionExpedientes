package com.example.gestionexpedientesbackend.repository;

import com.example.gestionexpedientesbackend.model.Expediente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpedienteRepository extends JpaRepository<Expediente, Long> {}

