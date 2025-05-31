package com.example.gestionexpedientesbackend.dto;

import com.example.gestionexpedientesbackend.model.Cargo;
import com.example.gestionexpedientesbackend.model.Documento;
import com.example.gestionexpedientesbackend.model.Expediente;
import com.example.gestionexpedientesbackend.model.Usuario;

import java.util.List;

public class ExpedienteDetalleResponseDTO {
    private Expediente expediente;
    private List<Documento> documentos;
    private Cargo cargo;
    private List<Usuario> usuariosEmisores;
    private List<Usuario> usuariosDestinatarios;

    // Getters y setters
    public Expediente getExpediente() { return expediente; }
    public void setExpediente(Expediente expediente) { this.expediente = expediente; }
    public List<Documento> getDocumentos() { return documentos; }
    public void setDocumentos(List<Documento> documentos) { this.documentos = documentos; }
    public Cargo getCargo() { return cargo; }
    public void setCargo(Cargo cargo) { this.cargo = cargo; }
    public List<Usuario> getUsuariosEmisores() { return usuariosEmisores; }
    public void setUsuariosEmisores(List<Usuario> usuariosEmisores) { this.usuariosEmisores = usuariosEmisores; }
    public List<Usuario> getUsuariosDestinatarios() { return usuariosDestinatarios; }
    public void setUsuariosDestinatarios(List<Usuario> usuariosDestinatarios) { this.usuariosDestinatarios = usuariosDestinatarios; }
}
