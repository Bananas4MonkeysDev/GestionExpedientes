package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.model.Auditoria;
import com.example.gestionexpedientesbackend.repository.AuditoriaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuditoriaServiceImpl implements AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;

    public AuditoriaServiceImpl(AuditoriaRepository auditoriaRepository) {
        this.auditoriaRepository = auditoriaRepository;
    }

    @Override
    public Auditoria registrarAuditoria(Auditoria auditoria) {
        auditoria.setFechaHora(LocalDateTime.now());
        return auditoriaRepository.save(auditoria);
    }
}
