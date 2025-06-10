package com.example.gestionexpedientesbackend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Auditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime fechaHora;

    private String usuario; // puede ser el nombre, el correo o ID textual

    private String accion; // "CREACION", "EDICION", "ELIMINACION"

    private Long expedienteId;

    private Long documentoId;

    private Long cargoId;

    private String descripcion; // opcional, para texto libre
    // Auditoria.java
    private Long usuarioId;
    private Long proyectoId;

    public Long getProyectoId() { return proyectoId; }
    public void setProyectoId(Long proyectoId) { this.proyectoId = proyectoId; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }


    // Getters y setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getFechaHora() { return fechaHora; }
    public void setFechaHora(LocalDateTime fechaHora) { this.fechaHora = fechaHora; }

    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }

    public String getAccion() { return accion; }
    public void setAccion(String accion) { this.accion = accion; }

    public Long getExpedienteId() { return expedienteId; }
    public void setExpedienteId(Long expedienteId) { this.expedienteId = expedienteId; }

    public Long getDocumentoId() { return documentoId; }
    public void setDocumentoId(Long documentoId) { this.documentoId = documentoId; }

    public Long getCargoId() { return cargoId; }
    public void setCargoId(Long cargoId) { this.cargoId = cargoId; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
}
