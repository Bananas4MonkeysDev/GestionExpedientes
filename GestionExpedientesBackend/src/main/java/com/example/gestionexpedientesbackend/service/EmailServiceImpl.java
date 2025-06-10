package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.model.Cargo;
import com.example.gestionexpedientesbackend.model.Documento;
import com.example.gestionexpedientesbackend.model.Expediente;
import com.example.gestionexpedientesbackend.model.Usuario;
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
    private JavaMailSender mailSender;

    @Override
    public void enviarCorreoConAdjunto(List<String> destinatarios, String asunto, String cuerpo, File adjunto) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true);

            for (String correo : destinatarios) {
                helper.addTo(correo);
            }

            helper.setSubject(asunto);
            helper.setText(cuerpo, false); // false = texto plano
            helper.setFrom("notificaciones@tudominio.com"); // <-- tu correo institucional

            if (adjunto != null && adjunto.exists()) {
                FileSystemResource file = new FileSystemResource(adjunto);
                helper.addAttachment(adjunto.getName(), file);
            }

            mailSender.send(mensaje);

        } catch (MessagingException e) {
            throw new RuntimeException("Error al enviar el correo: " + e.getMessage());
        }
    }

    @Override
    public String generarMensajeExpediente(Expediente expediente, List<Documento> documentos, String nombreRemitente) {
        StringBuilder sb = new StringBuilder();
        System.out.println(nombreRemitente);
        sb.append("Estimado usuario,\n\n");
        sb.append("Se le informa que se ha registrado un nuevo expediente en el sistema.\n\n");

        sb.append("Detalles del expediente:\n");
        sb.append("Código: ").append(expediente.getCodigo()).append("\n");
        sb.append("Asunto: ").append(expediente.getAsunto()).append("\n");
        sb.append("Fecha: ").append(expediente.getFecha()).append("\n");
        sb.append("Proyecto: ").append(expediente.getProyecto()).append("\n\n");

        if (!documentos.isEmpty()) {
            sb.append("Documentos asociados:\n");
            for (Documento doc : documentos) {
                sb.append("- ").append(doc.getCodigo()).append(": ").append(doc.getNombreArchivo()).append("\n");
            }
        } else {
            sb.append("Este expediente no contiene documentos adjuntos.\n");
        }

        sb.append("\nPor favor, revise y apruebe los documentos asociados en el siguiente enlace:\n");
        sb.append("http://localhost:4200/revision-expediente/").append(expediente.getId()).append("\n\n");

        sb.append("Gracias por su atención.\n\n");
        sb.append("Atentamente,\n");
        sb.append(nombreRemitente).append("\n");
        sb.append("[Área o institución]\n");

        return sb.toString();
    }



    @Override
    public String generarMensajeCargo(Cargo cargo, List<Documento> documentos, Expediente expediente, String nombreRemitente) {
        StringBuilder sb = new StringBuilder();

        sb.append("Estimado usuario,\n\n");
        sb.append("Le informamos que se ha generado un nuevo cargo en relación al expediente:\n\n");
        sb.append("Expediente: ").append(expediente.getCodigo()).append("\n");
        sb.append("Código del cargo: ").append(cargo.getCodigo()).append("\n");
        sb.append("Fecha de recepción: ").append(cargo.getFecha()).append(" a las ").append(cargo.getHora()).append("\n\n");

        if (!documentos.isEmpty()) {
            sb.append("Documentos cargados:\n");
            for (Documento doc : documentos) {
                sb.append("- ").append(doc.getCodigo()).append(": ").append(doc.getNombreArchivo()).append("\n");
            }
        } else {
            sb.append("No se registraron documentos adicionales en este cargo.\n");
        }

        sb.append("\nPuede revisar los detalles del cargo y visualizar el documento generado en el siguiente enlace:\n");
        sb.append("http://localhost:4200/ver-cargo/").append(cargo.getUuid()).append("\n\n");

        sb.append("Por favor, no responda a este mensaje. Si tiene consultas, comuníquese con el área correspondiente.\n\n");
        sb.append("Atentamente,\n");
        sb.append(nombreRemitente).append("\n");
        sb.append("[Área o Institución]\n");

        return sb.toString();
    }


    @Override
    public void notificarDestinatariosExpediente(Expediente expediente, List<Usuario> destinatarios, List<Documento> documentos) {
        List<String> correos = destinatarios.stream().map(Usuario::getCorreo).toList();

        String asunto = "Nuevo expediente recibido – Código " + expediente.getCodigo();

        StringBuilder mensaje = new StringBuilder();
        mensaje.append("Ha recibido un nuevo expediente. Código: ").append(expediente.getCodigo()).append("\n");
        mensaje.append("Asunto: ").append(expediente.getAsunto()).append("\n\n");

        if (!documentos.isEmpty()) {
            mensaje.append("Documentos adjuntos:\n");
            for (Documento doc : documentos) {
                mensaje.append("- ").append(doc.getCodigo()).append(": ").append(doc.getNombreArchivo()).append("\n");
            }
        }

        mensaje.append("\nValide los documentos en la plataforma:\n");
        mensaje.append("http://localhost:4200/validar-expediente/").append(expediente.getId());

        enviarCorreo(correos, asunto, mensaje.toString());
    }

    @Override
    public void notificarEmisoresCargo(Cargo cargo, Expediente expediente, List<Usuario> emisores, List<Documento> documentos) {
        List<String> correos = emisores.stream().map(Usuario::getCorreo).toList();

        String asunto = "Confirmación de cargo – " + expediente.getCodigo();

        StringBuilder mensaje = new StringBuilder();
        mensaje.append("Se generó un nuevo cargo para el expediente ").append(expediente.getCodigo()).append("\n");
        mensaje.append("Código de cargo: ").append(cargo.getCodigo()).append("\n");
        mensaje.append("Fecha: ").append(cargo.getFecha()).append(" ").append(cargo.getHora()).append("\n\n");

        if (!documentos.isEmpty()) {
            mensaje.append("Documentos cargados:\n");
            for (Documento doc : documentos) {
                mensaje.append("- ").append(doc.getCodigo()).append(": ").append(doc.getNombreArchivo()).append("\n");
            }
        }

        mensaje.append("\nVer el documento de cargo en línea:\n");
        mensaje.append("http://localhost:4200/visualizar-cargo/").append(cargo.getId());

        enviarCorreo(correos, asunto, mensaje.toString());
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
