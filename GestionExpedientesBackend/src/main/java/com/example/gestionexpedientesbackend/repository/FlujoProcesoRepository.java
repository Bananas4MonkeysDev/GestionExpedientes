package com.example.gestionexpedientesbackend.repository;

import com.example.gestionexpedientesbackend.model.FlujoProceso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlujoProcesoRepository extends JpaRepository<FlujoProceso, Long> {
    @Query("SELECT f.expedienteId FROM FlujoProceso f WHERE " +
            "CONCAT('|', f.usuarios, '|') LIKE %:match%")
    List<Long> findExpedientesIdPorUsuarioFirmante(@Param("match") String match);
    @Query("SELECT f FROM FlujoProceso f WHERE CONCAT('|', f.usuarios, '|') LIKE %:usuarioId%")
    List<FlujoProceso> findByUsuarioAsignado(@Param("usuarioId") String usuarioId);

    List<FlujoProceso> findByExpedienteIdAndNivel(Long expedienteId, int nivel);
    List<FlujoProceso> findByExpedienteIdAndEstado(Long expedienteId, String estado);

}