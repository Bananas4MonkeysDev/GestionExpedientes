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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmailServiceImpl implements EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Autowired
    private ProyectoService proyectoService;
    @Autowired
    private GrupoAreaService grupoAreaService;

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
        String nombreGrupoArea = "[Área o institución]";
        if (expediente.getCreadoPor() != null) {
            logger.info("ID del usuario creador del expediente: {}", expediente.getCreadoPor());

            List<GrupoArea> grupos = grupoAreaService.buscarGruposAreasPorUsuarioId(expediente.getCreadoPor());

            logger.info("Grupos encontrados para el usuario: {}", grupos.stream().map(GrupoArea::getNombre).toList());

            if (!grupos.isEmpty()) {
                nombreGrupoArea = grupos.stream()
                        .map(GrupoArea::getNombre)
                        .collect(Collectors.joining(", "));
            } else {
                logger.warn("No se encontraron grupos para el usuario con ID {}", expediente.getCreadoPor());
            }
        } else {
            logger.warn("El expediente no tiene usuario creador asignado.");
        }


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

        // Botón visual (versión compatible con correo - sin hover dinámico)
        sb.append("<table role='presentation' cellspacing='0' cellpadding='0'><tr><td align='center'>");
        sb.append("<a href='http://localhost:4200/revision-expediente/")
                .append(expediente.getId())
                .append("' style='")
                .append("display: inline-block; ")
                .append("padding: 12px 24px; ")
                .append("font-size: 16px; ")
                .append("font-weight: bold; ")
                .append("font-family: Arial, sans-serif; ")
                .append("color: #ffffff; ")
                .append("background-color: #F36C21; ")
                .append("border-radius: 8px; ")
                .append("text-decoration: none; ")
                .append("box-shadow: 0 4px 12px rgba(243, 108, 33, 0.4); ")
                .append("'>")
                .append("Haz clic aquí para ver el expediente")
                .append("</a>");
        sb.append("</td></tr></table>");


        sb.append("<p style='margin-top: 30px; font-size: 14px;'>Gracias por su atención.</p>");

        sb.append("<p>Atentamente,<br>");
        sb.append(nombreRemitente).append("<br>");
        sb.append("<em>").append(nombreGrupoArea).append("</em></p>");

        sb.append("</body></html>");

        return sb.toString();
    }

    @Override
    public String generarMensajeCargo(Cargo cargo, List<Documento> documentos, Expediente expediente, String nombreRemitente) {
        String nombreGrupoArea = "[Área o institución]";
        if (cargo.getUsuarioCreadorId() != null) {
            logger.info("ID del usuario creador del cargo: {}", cargo.getUsuarioCreadorId());

            List<GrupoArea> grupos = grupoAreaService.buscarGruposAreasPorUsuarioId(cargo.getUsuarioCreadorId());

            logger.info("Grupos encontrados para el usuario: {}", grupos.stream().map(GrupoArea::getNombre).toList());

            if (!grupos.isEmpty()) {
                nombreGrupoArea = grupos.stream()
                        .map(GrupoArea::getNombre)
                        .collect(Collectors.joining(", "));
            } else {
                logger.warn("No se encontraron grupos para el usuario con ID {}", cargo.getUsuarioCreadorId());
            }
        } else {
            logger.warn("El cargo no tiene usuario creador asignado.");
        }


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

        sb.append("<table role='presentation' cellspacing='0' cellpadding='0'><tr><td align='center'>");
        sb.append("<a href='http://localhost:4200/ver-cargo/")
                .append(cargo.getUuid())
                .append("' style='")
                .append("display: inline-block; ")
                .append("padding: 12px 24px; ")
                .append("font-size: 16px; ")
                .append("font-weight: bold; ")
                .append("font-family: Arial, sans-serif; ")
                .append("color: #ffffff; ")
                .append("background-color: #F36C21; ")
                .append("border-radius: 8px; ")
                .append("text-decoration: none; ")
                .append("box-shadow: 0 4px 12px rgba(243, 108, 33, 0.4); ")
                .append("'>")
                .append("Haz clic aquí para ver cargo")
                .append("</a>");
        sb.append("</td></tr></table>");

        sb.append("<p style='margin-top: 30px; font-size: 14px;'>Por favor, no responda a este mensaje. Si tiene consultas, comuníquese con el área correspondiente.</p>");

        sb.append("<p>Atentamente,<br>");
        sb.append(nombreRemitente).append("<br>");
        sb.append("<em>").append(nombreGrupoArea).append("</em></p>");

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
