package com.example.gestionexpedientesbackend.dto;

public class ExpedienteDTO {
    private String asunto;
    private String fecha;
    private String proyecto;
    private String comentario;
    private boolean reservado;
    private String usuariosEmisores; // IDs separados por "|"
    private String usuariosDestinatarios;
    private String referencias;

    // Getters y setters
    public String getAsunto() { return asunto; }
    public void setAsunto(String asunto) { this.asunto = asunto; }

    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }

    public String getProyecto() { return proyecto; }
    public void setProyecto(String proyecto) { this.proyecto = proyecto; }

    public String getComentario() { return comentario; }
    public void setComentario(String comentario) { this.comentario = comentario; }

    public boolean isReservado() { return reservado; }
    public void setReservado(boolean reservado) { this.reservado = reservado; }

    public String getUsuariosEmisores() { return usuariosEmisores; }
    public void setUsuariosEmisores(String usuariosEmisores) { this.usuariosEmisores = usuariosEmisores; }

    public String getUsuariosDestinatarios() { return usuariosDestinatarios; }
    public void setUsuariosDestinatarios(String usuariosDestinatarios) { this.usuariosDestinatarios = usuariosDestinatarios; }

    public String getReferencias() { return referencias; }
    public void setReferencias(String referencias) { this.referencias = referencias; }
}
