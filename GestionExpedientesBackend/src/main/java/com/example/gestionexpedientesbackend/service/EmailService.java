package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.model.Cargo;
import com.example.gestionexpedientesbackend.model.Documento;
import com.example.gestionexpedientesbackend.model.Expediente;
import com.example.gestionexpedientesbackend.model.Usuario;

import java.io.File;
import java.util.List;

public interface EmailService {
    void enviarCorreoConAdjunto(List<String> destinatarios, String asunto, String cuerpo);
    String generarMensajeExpediente(Expediente expediente, List<Documento> documentos, String nombreRemitente);
    String generarMensajeCargo(Cargo cargo, List<Documento> documentos, Expediente expediente, String nombreRemitente);
    void enviarCorreoSimple(List<String> destinatarios, String asunto, String cuerpo);
    String generarMensajeFirma(String nombreUsuario, Expediente expediente, List<Documento> documentos, int nivel, String fechaLimite, String nombreRemitente);
    String generarMensajeEspera(String nombreUsuario, Expediente expediente, int nivel, String nombreRemitente);
    public String generarMensajeAprobacion(Expediente expediente, List<Documento> documentos, String nombreRemitente);
    public String generarMensajePendiente(String nombreUsuario, Expediente expediente);
    public String generarMensajeObservacionDestinatario(String nombreDestinatario, Expediente expediente,
                                                        List<Documento> documentos, String comentario,
                                                        String remitente);
    public String generarMensajeObservacionUsuario(String nombreUsuario, Expediente expediente,
                                                   List<Documento> documentos, String comentario,
                                                   String remitente);
}
