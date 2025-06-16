package com.example.gestionexpedientesbackend.repository;

import com.example.gestionexpedientesbackend.model.GrupoArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GrupoAreaRepository extends JpaRepository<GrupoArea, Long> {
    @Query("SELECT g FROM GrupoArea g WHERE CONCAT('|', g.usuariosIds, '|') LIKE %:userIdPattern%")
    List<GrupoArea> buscarTodosPorUsuarioId(@Param("userIdPattern") String userIdPattern);

}