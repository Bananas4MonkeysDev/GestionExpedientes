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

}
