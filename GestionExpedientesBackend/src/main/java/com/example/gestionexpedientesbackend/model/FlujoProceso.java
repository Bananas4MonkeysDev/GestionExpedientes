package com.example.gestionexpedientesbackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "flujo_proceso")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlujoProceso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipoNivel; // General o Especifico

    private Integer nivel;

    @Column(length = 1000)
    private String usuarios; // Ejemplo: "3|4|7"
    @Column(length = 1000)
    private String usuariosFirmantes;
    private Long expedienteId;

    @Column(length = 1000)
    private String documentosId;
    // Ejemplo: "12|15|22" o solo "12"
    @Column(length = 1000)
    private String documentosFirmados; // Ejemplo: "12|15|22" o solo "12"

    private LocalDate fechaLimite;

    private String estado; // PENDIENTE o FIRMADO

    public String getDocumentosFirmados() {
        return documentosFirmados;
    }

    public void setDocumentosFirmados(String documentosFirmados) {
        this.documentosFirmados = documentosFirmados;
    }

    public String getUsuariosFirmantes() {
        return usuariosFirmantes;
    }

    public void setUsuariosFirmantes(String usuariosFirmantes) {
        this.usuariosFirmantes = usuariosFirmantes;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTipoNivel() {
        return tipoNivel;
    }

    public void setTipoNivel(String tipoNivel) {
        this.tipoNivel = tipoNivel;
    }

    public Integer getNivel() {
        return nivel;
    }

    public void setNivel(Integer nivel) {
        this.nivel = nivel;
    }

    public String getUsuarios() {
        return usuarios;
    }

    public void setUsuarios(String usuarios) {
        this.usuarios = usuarios;
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

    public LocalDate getFechaLimite() {
        return fechaLimite;
    }

    public void setFechaLimite(LocalDate fechaLimite) {
        this.fechaLimite = fechaLimite;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}