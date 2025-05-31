package com.example.gestionexpedientesbackend.repository;

import com.example.gestionexpedientesbackend.model.Cargo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CargoRepository extends JpaRepository<Cargo, Long> {
    List<Cargo> findAllByExpedienteIdOrderByOrdenDesc(Long expedienteId);
    List<Cargo> findByExpedienteIdOrderByOrdenDesc(Long expedienteId);

}

