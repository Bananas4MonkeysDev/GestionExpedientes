package com.example.gestionexpedientesbackend.repository;

import com.example.gestionexpedientesbackend.model.Cargo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CargoRepository extends JpaRepository<Cargo, Long> {
}
