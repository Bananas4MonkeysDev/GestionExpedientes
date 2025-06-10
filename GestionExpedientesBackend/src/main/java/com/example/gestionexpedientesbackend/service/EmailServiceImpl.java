package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.model.*;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.List;

@Service
public class EmailServiceImpl implements EmailService {
    @Autowired
    private ProyectoService proyectoService;

    @Autowired
    private JavaMailSender mailSender;

    @Override
    public void enviarCorreoConAdjunto(List<String> destinatarios, String asunto, String cuerpo) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true);
            for (String correo : destinatarios) {
                helper.addTo(correo);
            }
            helper.setSubject(asunto);
            helper.setText(cuerpo, true); // false = texto plano
            helper.setFrom("notificaciones@tudominio.com"); // <-- tu correo institucional

            mailSender.send(mensaje);
        } catch (MessagingException e) {
            throw new RuntimeException("Error al enviar el correo: " + e.getMessage());
        }
    }

    @Override
    public String generarMensajeExpediente(Expediente expediente, List<Documento> documentos, String nombreRemitente) {
        StringBuilder sb = new StringBuilder();

        sb.append("<html><body style='font-family: Arial, sans-serif; color: #333;'>");

        sb.append("<p>Estimado usuario,</p>");

        sb.append("<p>Se le informa que se ha registrado un nuevo <strong>expediente</strong> en el sistema.</p>");
        Long proyectoId = null;
        try {
            proyectoId = Long.parseLong(expediente.getProyecto());
        } catch (NumberFormatException e) {
            // manejar error si no es un número válido
        }

        String nombreProyecto = "Sin proyecto";
        if (proyectoId != null) {
            Proyecto proyecto = proyectoService.obtenerPorId(proyectoId);
            if (proyecto != null) {
                nombreProyecto = proyecto.getNombre();
            }
        }

        sb.append("<ul>");
        sb.append("<li><strong>Código:</strong> ").append(expediente.getCodigo()).append("</li>");
        sb.append("<li><strong>Asunto:</strong> ").append(expediente.getAsunto()).append("</li>");
        sb.append("<li><strong>Fecha:</strong> ").append(expediente.getFecha()).append("</li>");
        sb.append("<li><strong>Proyecto:</strong> ").append(nombreProyecto).append("</li>");
        sb.append("</ul>");

        if (!documentos.isEmpty()) {
            sb.append("<p><strong>Documentos asociados:</strong></p>");
            sb.append("<ul>");
            for (Documento doc : documentos) {
                sb.append("<li>").append(doc.getCodigo()).append(": ").append(doc.getNombreArchivo()).append("</li>");
            }
            sb.append("</ul>");
        } else {
            sb.append("<p><em>Este expediente no contiene documentos adjuntos.</em></p>");
        }

        // Botón visual
        sb.append("<p style='margin-top: 20px;'>");
        sb.append("<a href='http://localhost:4200/revision-expediente/").append(expediente.getId()).append("' ")
                .append("style='display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #004C77; text-decoration: none; border-radius: 5px;'>")
                .append("Ver expediente")
                .append("</a>");
        sb.append("</p>");

        sb.append("<p style='margin-top: 30px; font-size: 14px;'>Gracias por su atención.</p>");

        sb.append("<p>Atentamente,<br>");
        sb.append(nombreRemitente).append("<br>");
        sb.append("<em>[Área o institución]</em></p>");

        sb.append("</body></html>");

        return sb.toString();
    }

    @Override
    public String generarMensajeCargo(Cargo cargo, List<Documento> documentos, Expediente expediente, String nombreRemitente) {
        StringBuilder sb = new StringBuilder();

        sb.append("<html><body style='font-family: Arial, sans-serif; color: #333;'>");

        sb.append("<p>Estimado usuario,</p>");

        sb.append("<p>Le informamos que se ha generado un nuevo <strong>cargo</strong> en relación al siguiente expediente:</p>");

        sb.append("<ul>");
        sb.append("<li><strong>Expediente:</strong> ").append(expediente.getCodigo()).append("</li>");
        sb.append("<li><strong>Código del cargo:</strong> ").append(cargo.getCodigo()).append("</li>");
        sb.append("<li><strong>Fecha de recepción:</strong> ").append(cargo.getFecha()).append(" a las ").append(cargo.getHora()).append("</li>");
        sb.append("</ul>");

        if (!documentos.isEmpty()) {
            sb.append("<p><strong>Documentos cargados:</strong></p>");
            sb.append("<ul>");
            for (Documento doc : documentos) {
                sb.append("<li>").append(doc.getCodigo()).append(": ").append(doc.getNombreArchivo()).append("</li>");
            }
            sb.append("</ul>");
        } else {
            sb.append("<p>No se registraron documentos adicionales en este cargo.</p>");
        }

        // Botón visual
        sb.append("<p style='margin-top: 20px;'>");
        sb.append("<a href='http://localhost:4200/ver-cargo/").append(cargo.getUuid()).append("' ")
                .append("style='display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #004C77; text-decoration: none; border-radius: 5px;'>")
                .append("Ver documento de cargo")
                .append("</a>");
        sb.append("</p>");

        sb.append("<p style='margin-top: 30px; font-size: 14px;'>Por favor, no responda a este mensaje. Si tiene consultas, comuníquese con el área correspondiente.</p>");

        sb.append("<p>Atentamente,<br>");
        sb.append(nombreRemitente).append("<br>");
        sb.append("<em>[Área o Institución]</em></p>");

        sb.append("</body></html>");

        return sb.toString();
    }

    private void enviarCorreo(List<String> destinatarios, String asunto, String cuerpo) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");

            helper.setTo(destinatarios.toArray(new String[0]));
            helper.setSubject(asunto);
            helper.setText(cuerpo, false); // false = texto plano

            helper.setFrom("notificaciones@tudominio.com"); // <-- reemplaza por tu correo real

            mailSender.send(mensaje);

        } catch (MessagingException e) {
            throw new RuntimeException("Error al enviar el correo", e);
        }
    }
    @Override
    public void enviarCorreoSimple(List<String> destinatarios, String asunto, String cuerpo) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setTo(destinatarios.toArray(new String[0]));
        mensaje.setSubject(asunto);
        mensaje.setText(cuerpo);
        mensaje.setFrom("notificaciones@tudominio.com");  // Reemplaza con tu correo institucional
        mailSender.send(mensaje);
    }

}
