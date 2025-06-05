package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.model.Cargo;
import com.example.gestionexpedientesbackend.model.Documento;
import com.example.gestionexpedientesbackend.model.Expediente;
import com.example.gestionexpedientesbackend.model.Usuario;

import java.io.File;
import java.util.List;

public interface EmailService {
    void enviarCorreoConAdjunto(List<String> destinatarios, String asunto, String cuerpo, File adjunto);
    void notificarDestinatariosExpediente(Expediente expediente, List<Usuario> destinatarios, List<Documento> documentos);
    void notificarEmisoresCargo(Cargo cargo, Expediente expediente, List<Usuario> emisores, List<Documento> documentos);
    String generarMensajeExpediente(Expediente expediente, List<Documento> documentos);
    String generarMensajeCargo(Cargo cargo, List<Documento> documentos, Expediente expediente);
    void enviarCorreoSimple(List<String> destinatarios, String asunto, String cuerpo);

}
