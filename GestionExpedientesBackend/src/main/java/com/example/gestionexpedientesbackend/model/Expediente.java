package com.example.gestionexpedientesbackend.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.List;

@Entity
public class Expediente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String tipoExpediente;
    private String asunto;
    @Column(name = "codigo")
    private String codigo;
    public String getCodigo() {
        return codigo;
    }
    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }
    private String estado;
    private String proyecto;
    private String fecha;
    private String comentario;
    private boolean reservado;
    @Column(name = "fecha_limite_respuesta")
    private LocalDate fechaLimiteRespuesta;

    @Column(name = "creado_por")
    private Long creadoPor;
    @Column(length = 1000)
    private String usuariosEmisores;
    @Column(name = "leido")
    private boolean leido = false;
   @Column(name = "archivado")
    private boolean archivado = false;
    @Column(name="desechado")
    private boolean desechado = false;

    public LocalDate getFechaLimiteRespuesta() {
        return fechaLimiteRespuesta;
    }

    public void setFechaLimiteRespuesta(LocalDate fechaLimiteRespuesta) {
        this.fechaLimiteRespuesta = fechaLimiteRespuesta;
    }

    public Long getId() {
        return id;
    }

    public boolean isDesechado() {
        return desechado;
    }

    public void setDesechado(boolean desechado) {
        this.desechado = desechado;
    }

    public boolean isLeido() {
        return leido;
    }

    public void setLeido(boolean leido) {
        this.leido = leido;
    }

    public boolean isArchivado() {
        return archivado;
    }

    public void setArchivado(boolean archivado) {
        this.archivado = archivado;
    }

    public String getEstado() {
        return estado;
    }
    public Long getCreadoPor() {
        return creadoPor;
    }
    public void setCreadoPor(Long creadoPor) {
        this.creadoPor = creadoPor;
    }
    public void setEstado(String estado) {
        this.estado = estado;
    }
    public void setId(Long id) {
        this.id = id;
    }

    public String getTipoExpediente() {
        return tipoExpediente;
    }

    public void setTipoExpediente(String tipoExpediente) {
        this.tipoExpediente = tipoExpediente;
    }

    public String getAsunto() {
        return asunto;
    }

    public void setAsunto(String asunto) {
        this.asunto = asunto;
    }

    public String getProyecto() {
        return proyecto;
    }

    public void setProyecto(String proyecto) {
        this.proyecto = proyecto;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public String getComentario() {
        return comentario;
    }

    public void setComentario(String comentario) {
        this.comentario = comentario;
    }

    public boolean isReservado() {
        return reservado;
    }

    public void setReservado(boolean reservado) {
        this.reservado = reservado;
    }

    public String getUsuariosEmisores() {
        return usuariosEmisores;
    }

    public void setUsuariosEmisores(String usuariosEmisores) {
        this.usuariosEmisores = usuariosEmisores;
    }

    public String getUsuariosDestinatarios() {
        return usuariosDestinatarios;
    }

    public void setUsuariosDestinatarios(String usuariosDestinatarios) {
        this.usuariosDestinatarios = usuariosDestinatarios;
    }

    public String getReferencias() {
        return referencias;
    }

    public void setReferencias(String referencias) {
        this.referencias = referencias;
    }

    @Column(length = 1000)
    private String usuariosDestinatarios; // Ejemplo: "4|5|6"

    @Column(length = 1000)
    private String referencias;           // Ejemplo: "EXP-7845|CARTA-001"
}
