package com.example.gestionexpedientesbackend.dto;

public class EstadoExpedienteDTO {
    private String estado;
    private String fechaLimite;
    // Getters y Setters
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getFechaLimite() { return fechaLimite; }
    public void setFechaLimite(String fechaLimite) { this.fechaLimite = fechaLimite; }
}