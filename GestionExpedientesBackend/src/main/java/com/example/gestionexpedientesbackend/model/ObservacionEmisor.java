package com.example.gestionexpedientesbackend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "observaciones_emisor")
public class ObservacionEmisor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long flujoId;
    private Long expedienteId;
    private String documentosId; // mismo formato que flujo_proceso
    private String comentario;
    private LocalDateTime fecha;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getFlujoId() {
        return flujoId;
    }

    public void setFlujoId(Long flujoId) {
        this.flujoId = flujoId;
    }

    public Long getExpedienteId() {
        return expedienteId;
    }

    public void setExpedienteId(Long expedienteId) {
        this.expedienteId = expedienteId;
    }

    public String getDocumentosId() {
        return documentosId;
    }

    public void setDocumentosId(String documentosId) {
        this.documentosId = documentosId;
    }

    public String getComentario() {
        return comentario;
    }

    public void setComentario(String comentario) {
        this.comentario = comentario;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }
// Getters y setters
}
