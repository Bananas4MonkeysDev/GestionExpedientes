package com.example.gestionexpedientesbackend.model;

import jakarta.persistence.*;

@Entity
public class Documento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String codigo;
    private String nombreArchivo;
    private String rutaArchivo;
    private String tipoDocumento;

    private Long tamaño;
    private boolean visibleParaExternos;

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    @ManyToOne
    @JoinColumn(name = "expediente_id")
    private Expediente expediente;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombreArchivo() {
        return nombreArchivo;
    }

    public void setNombreArchivo(String nombreArchivo) {
        this.nombreArchivo = nombreArchivo;
    }

    public String getRutaArchivo() {
        return rutaArchivo;
    }

    public void setRutaArchivo(String rutaArchivo) {
        this.rutaArchivo = rutaArchivo;
    }

    public String getTipoDocumento() {
        return tipoDocumento;
    }

    public void setTipoDocumento(String tipoDocumento) {
        this.tipoDocumento = tipoDocumento;
    }

    public Long getTamaño() {
        return tamaño;
    }

    public void setTamaño(Long tamaño) {
        this.tamaño = tamaño;
    }

    public boolean isVisibleParaExternos() {
        return visibleParaExternos;
    }

    public void setVisibleParaExternos(boolean visibleParaExternos) {
        this.visibleParaExternos = visibleParaExternos;
    }

    public Expediente getExpediente() {
        return expediente;
    }

    public void setExpediente(Expediente expediente) {
        this.expediente = expediente;
    }
// Getters y Setters
}
