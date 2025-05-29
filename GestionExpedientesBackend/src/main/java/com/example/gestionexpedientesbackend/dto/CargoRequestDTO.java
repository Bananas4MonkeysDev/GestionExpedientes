package com.example.gestionexpedientesbackend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class CargoRequestDTO {
    private LocalDate fecha;
    private LocalTime hora;
    private Long expedienteId;
    private String mensaje; // Puede venir vacío o null si quieres que se genere en backend
    private String archivoPath; // Opcional

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public LocalTime getHora() {
        return hora;
    }

    public void setHora(LocalTime hora) {
        this.hora = hora;
    }

    public Long getExpedienteId() {
        return expedienteId;
    }

    public void setExpedienteId(Long expedienteId) {
        this.expedienteId = expedienteId;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public String getArchivoPath() {
        return archivoPath;
    }

    public void setArchivoPath(String archivoPath) {
        this.archivoPath = archivoPath;
    }
// Getters y setters
}
