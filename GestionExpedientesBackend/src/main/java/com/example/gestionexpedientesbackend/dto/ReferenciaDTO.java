package com.example.gestionexpedientesbackend.dto;

public class ReferenciaDTO {
    private long id;
    private String tipo; // "Documento" o "Expediente"
    private String serie; // DOC-00001 o EXP-00001
    private String asunto; // Nombre de archivo o asunto del expediente

    // Getters y setters

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getSerie() {
        return serie;
    }

    public void setSerie(String serie) {
        this.serie = serie;
    }

    public String getAsunto() {
        return asunto;
    }

    public void setAsunto(String asunto) {
        this.asunto = asunto;
    }
}
