package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.dto.FlujoProcesoRequest;
import com.example.gestionexpedientesbackend.model.*;
import com.example.gestionexpedientesbackend.repository.ExpedienteRepository;
import com.example.gestionexpedientesbackend.repository.FlujoProcesoRepository;
import com.example.gestionexpedientesbackend.repository.ObservacionEmisorRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import io.jsonwebtoken.io.IOException;
import jakarta.transaction.Transactional;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.util.Matrix;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;


@Service
public class FlujoProcesoServiceImpl implements FlujoProcesoService {
    @Autowired
    private ObservacionEmisorRepository observacionEmisorRepository;
    @Autowired
    private FlujoProcesoRepository flujoProcesoRepository;
    @Autowired
    private ExpedienteRepository expedienteRepository;
    @Autowired
    private ExpedienteService expedienteService;

    @Autowired
    private DocumentoService documentoService;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private EmailService emailService;

    @Override
    public FlujoProceso registrarFlujo(FlujoProcesoRequest request) {
        FlujoProceso flujo = FlujoProceso.builder()
                .tipoNivel(request.getTipo_nivel())
                .nivel(request.getNivel())
                .usuarios(request.getUsuarios())
                .expedienteId(request.getExpediente_id())
                .documentosId(request.getDocumentos_id())
                .fechaLimite(request.getFecha_limite())
                .estado(request.getEstado())
                .modoConexion(request.getModoConexion())
                .build();
        // Paso 1: Obtener expediente y documentos relacionados
        Expediente expediente = expedienteService.obtenerPorId(flujo.getExpedienteId()).orElse(null);
        if (expediente == null) return flujo;

        List<Documento> documentos = documentoService.obtenerPorIdsSeparados(flujo.getDocumentosId());

        String nombreRemitente = "Sistema";
        if (expediente.getCreadoPor() != null) {
            Usuario creador = usuarioService.obtenerPorId(expediente.getCreadoPor()).orElse(null);
            if (creador != null) {
                nombreRemitente = creador.getNombre();
            }
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy");
        String fechaFormateada = flujo.getFechaLimite().format(formatter);
        List<Usuario> usuarios = usuarioService.obtenerPorIdsSeparados(flujo.getUsuarios());

        List<FlujoProceso> flujosPrevios = flujoProcesoRepository.findByExpedienteId(flujo.getExpedienteId())
                .stream()
                .filter(f -> f.getNivel() < flujo.getNivel())
                .collect(Collectors.toList());

        Set<String> usuariosPreviosIds = flujosPrevios.stream()
                .flatMap(f -> Arrays.stream(f.getUsuarios().split("\\|")))
                .collect(Collectors.toSet());

        for (Usuario usuario : usuarios) {
            // 🚫 Si el usuario ya participó en niveles anteriores, no le enviamos nada
            if (usuariosPreviosIds.contains(usuario.getId().toString())) {
                System.out.println("[INFO] Usuario " + usuario.getNombre() + " ya participó antes. No se enviará correo.");
                continue;
            }

            String mensaje = "";
            String asunto = "Expediente " + expediente.getCodigo();

            if (flujo.getNivel() == 1) {
                mensaje = emailService.generarMensajeFirma(
                        usuario.getNombre(),
                        expediente,
                        documentos,
                        flujo.getNivel(),
                        fechaFormateada,
                        nombreRemitente
                );
                asunto = "Firma requerida – " + asunto;
            } else {
                // Si tienes otro tipo de notificación para niveles > 1, la agregas aquí.
                // Si no hay mensaje, simplemente no enviamos correo.
                continue;
            }

            // 🚫 Evitar correos vacíos
            if (mensaje == null || mensaje.trim().isEmpty()) {
                System.out.println("[WARN] Mensaje vacío para " + usuario.getCorreo() + ", se omite el envío.");
                continue;
            }

            emailService.enviarCorreoConAdjunto(
                    List.of(usuario.getCorreo()),
                    asunto,
                    mensaje
            );
        }


        return flujoProcesoRepository.save(flujo);
    }
    @Override
    public void firmarDocumento(Long flujoId, Long documentoId, Long usuarioId) throws IOException, java.io.IOException {
        FlujoProceso flujo = flujoProcesoRepository.findById(flujoId)
                .orElseThrow(() -> new RuntimeException("Flujo no encontrado"));

        if (!flujo.getUsuarios().contains(usuarioId.toString())) {
            throw new RuntimeException("Usuario no autorizado para firmar este documento");
        }

        Documento documento = documentoService.obtenerPorId(documentoId)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado"));

        Usuario usuario = usuarioService.obtenerPorId(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // --- Firma física en PDF ---
        int posicion = calcularPosicionFirma(flujo.getUsuariosFirmantes());
        File archivoOriginal = new File(documento.getRutaArchivo());
        File firmado = firmarPDF(archivoOriginal, usuario.getNombre(), posicion);
        Files.copy(firmado.toPath(), archivoOriginal.toPath(), StandardCopyOption.REPLACE_EXISTING);

        // --- Actualizar firmantes ---
        Set<String> firmantes = flujo.getUsuariosFirmantes() == null || flujo.getUsuariosFirmantes().isEmpty()
                ? new HashSet<>() : new HashSet<>(Arrays.asList(flujo.getUsuariosFirmantes().split("\\|")));

        firmantes.add(usuarioId.toString());

        // --- Lógica nueva: modo "O" vs "Y" ---
        boolean flujoFirmado = false;

        if ("O".equalsIgnoreCase(flujo.getModoConexion())) {
            flujoFirmado = true;
            flujo.setUsuariosFirmantes(usuarioId.toString());
            flujo.setUsuarios(usuarioId.toString());
        } else {
            flujo.setUsuariosFirmantes(String.join("|", firmantes));
            int totalUsuarios = flujo.getUsuarios().split("\\|").length;
            int firmadosUsuarios = flujo.getUsuariosFirmantes() == null ? 0 : flujo.getUsuariosFirmantes().split("\\|").length;
            flujoFirmado = firmadosUsuarios >= totalUsuarios;
        }

        // --- Documentos firmados (modo General) ---
        if ("General".equalsIgnoreCase(flujo.getTipoNivel())) {
            Set<String> docsFirmados = flujo.getDocumentosFirmados() == null || flujo.getDocumentosFirmados().isEmpty()
                    ? new HashSet<>() : new HashSet<>(Arrays.asList(flujo.getDocumentosFirmados().split("\\|")));

            docsFirmados.add(documentoId.toString());
            flujo.setDocumentosFirmados(String.join("|", docsFirmados));
        }

        // --- Verificación de documentos firmados ---
        boolean todosDocumentosFirmados = true;
        if ("General".equalsIgnoreCase(flujo.getTipoNivel())) {
            int totalDocs = flujo.getDocumentosId().split("\\|").length;
            int firmadosDocs = flujo.getDocumentosFirmados() == null ? 0 : flujo.getDocumentosFirmados().split("\\|").length;
            todosDocumentosFirmados = firmadosDocs >= totalDocs;
        }

        // --- Estado del flujo ---
        if (flujoFirmado && todosDocumentosFirmados) {
            flujo.setEstado("FIRMADO");
        }

        flujoProcesoRepository.save(flujo);

        // --- Evaluar expediente ---
        Long expedienteId = flujo.getExpedienteId();
        List<FlujoProceso> flujos = flujoProcesoRepository.findByExpedienteId(expedienteId);

        boolean todosFirmados = flujos.stream().allMatch(f -> "FIRMADO".equalsIgnoreCase(f.getEstado()));
        Expediente expediente = expedienteRepository.findById(expedienteId)
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado"));

        // --- Si todo el expediente fue firmado ---
        if (todosFirmados) {
            expediente.setEstado("APROBADO");
            expedienteRepository.save(expediente);

            List<Usuario> destinatarios = usuarioService.obtenerPorIdsSeparados(expediente.getUsuariosDestinatarios());
            List<Documento> documentos = documentoService.obtenerPorExpedienteId(expedienteId);
            String remitente = expediente.getCreadoPor() != null
                    ? usuarioService.obtenerPorId(expediente.getCreadoPor()).map(Usuario::getNombre).orElse("Sistema")
                    : "Sistema";

            for (Usuario u : destinatarios) {
                String mensaje = emailService.generarMensajeAprobacion(expediente, documentos, remitente);
                emailService.enviarCorreoConAdjunto(List.of(u.getCorreo()), "Expediente aprobado – " + expediente.getCodigo(), mensaje);
            }
        }

        // --- Si el flujo actual se completó ---
        if ("FIRMADO".equals(flujo.getEstado())) {
            int siguienteNivel = flujo.getNivel() + 1;
            List<FlujoProceso> siguientes = flujoProcesoRepository.findByExpedienteIdAndNivel(expedienteId, siguienteNivel);

            for (FlujoProceso siguiente : siguientes) {
                List<Usuario> usuarios = usuarioService.obtenerPorIdsSeparados(siguiente.getUsuarios());
                List<Documento> docs = "General".equalsIgnoreCase(siguiente.getTipoNivel())
                        ? documentoService.obtenerPorIdsSeparados(siguiente.getDocumentosId())
                        : documentoService.obtenerPorId(Long.parseLong(siguiente.getDocumentosId())).map(List::of).orElse(List.of());

                String remitente = expediente.getCreadoPor() != null
                        ? usuarioService.obtenerPorId(expediente.getCreadoPor()).map(Usuario::getNombre).orElse("Sistema")
                        : "Sistema";

                String fecha = siguiente.getFechaLimite().format(DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy"));

                for (Usuario u : usuarios) {
                    String msg = emailService.generarMensajeFirma(u.getNombre(), expediente, docs, siguiente.getNivel(), fecha, remitente);
                    emailService.enviarCorreoConAdjunto(List.of(u.getCorreo()), "Firma requerida – Expediente " + expediente.getCodigo(), msg);
                }
            }
        }
    }


    private File firmarPDF(File archivoOriginal, String nombreUsuario, int posicionFirma)
            throws IOException, java.io.IOException {

        PDDocument document = PDDocument.load(archivoOriginal);
        String nombreArchivo = archivoOriginal.getName().replace(".pdf", "");
        String url = "https://tuservidor.com/expedientes/ver/" + nombreArchivo;

        float margen = 40f;
        float qrSize = 60f;
        float espacioFirma = 55f;

        // 🖨️ Recorremos todas las páginas para agregar el pie (QR + link)
        for (int i = 0; i < document.getNumberOfPages(); i++) {
            PDPage page = document.getPage(i);
            PDRectangle mediaBox = page.getMediaBox();
            float pageWidth = mediaBox.getWidth();

            PDPageContentStream contentStream = new PDPageContentStream(document, page,
                    PDPageContentStream.AppendMode.APPEND, true, true);

            // 🔲 Generar QR en esquina inferior izquierda
            BufferedImage qrImage = generarQRCode(url, (int) qrSize, (int) qrSize);
            PDImageXObject qrCode = LosslessFactory.createFromImage(document, qrImage);
            contentStream.drawImage(qrCode, margen, margen, qrSize, qrSize);

            // 🌐 Imprimir URL centrada abajo
            float textWidth = url.length() * 4.8f;
            float urlX = (pageWidth - textWidth) / 2;
            float urlY = margen + 20f;

            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_OBLIQUE, 9);
            contentStream.newLineAtOffset(urlX, urlY);
            contentStream.showText(url);
            contentStream.endText();

            contentStream.close();
        }

        // 🖋️ Agregar las firmas solo en la última página
        PDPage lastPage = document.getPage(document.getNumberOfPages() - 1);
        PDRectangle mediaBox = lastPage.getMediaBox();
        float pageWidth = mediaBox.getWidth();
        float firmaX = pageWidth - 250f;
        float firmaY = margen + 90f + (posicionFirma * espacioFirma);

        PDPageContentStream contentStream = new PDPageContentStream(document, lastPage,
                PDPageContentStream.AppendMode.APPEND, true, true);

        String textoFirma = "Firmado por: " + nombreUsuario +
                "\nMotivo: Firma Digital" +
                "\nFecha: " + obtenerFechaActual();

        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA, 9);
        contentStream.newLineAtOffset(firmaX, firmaY);
        for (String linea : textoFirma.split("\n")) {
            contentStream.showText(linea);
            contentStream.newLineAtOffset(0, -10);
        }
        contentStream.endText();

        contentStream.close();

        File tempFile = File.createTempFile("firmado_", ".pdf");
        document.save(tempFile);
        document.close();
        return tempFile;
    }


    private BufferedImage generarQRCode(String texto, int width, int height) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(texto, BarcodeFormat.QR_CODE, width, height);
            return MatrixToImageWriter.toBufferedImage(bitMatrix);
        } catch (Exception e) {
            throw new RuntimeException("Error generando QR", e);
        }
    }

    private String obtenerFechaActual() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm a");
        return LocalDateTime.now().format(formatter);
    }

    private int calcularPosicionFirma(String usuariosFirmantes) {
        if (usuariosFirmantes == null || usuariosFirmantes.isEmpty()) return 0;
        return usuariosFirmantes.split("\\|").length;
    }


    @Override
    public void eliminarFlujo(Long id) {
        FlujoProceso flujo = flujoProcesoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flujo no encontrado con id: " + id));

        int nivelEliminado = flujo.getNivel();
        Long expedienteId = flujo.getExpedienteId();
        String tipoNivel = flujo.getTipoNivel();
        String documentosId = flujo.getDocumentosId();
        flujoProcesoRepository.deleteById(id);
        List<FlujoProceso> siguientesNiveles;

        if ("Especifico".equalsIgnoreCase(tipoNivel)) {
            siguientesNiveles = flujoProcesoRepository
                    .findByExpedienteIdAndTipoNivelAndDocumentosIdAndNivelGreaterThanOrderByNivelAsc(
                            expedienteId, tipoNivel, documentosId, nivelEliminado
                    );
        } else {
            siguientesNiveles = flujoProcesoRepository
                    .findByExpedienteIdAndTipoNivelAndNivelGreaterThanOrderByNivelAsc(
                            expedienteId, tipoNivel, nivelEliminado
                    );
        }

        for (FlujoProceso siguiente : siguientesNiveles) {
            siguiente.setNivel(siguiente.getNivel() - 1);
            flujoProcesoRepository.save(siguiente);
        }
    }

    @Override
    public List<FlujoProceso> obtenerPorExpediente(Long expedienteId) {
        return flujoProcesoRepository.findByExpedienteId(expedienteId);
    }
    @Override
    public FlujoProceso actualizarFlujo(Long id, FlujoProcesoRequest request) {
        FlujoProceso flujo = flujoProcesoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FlujoProceso no encontrado con ID: " + id));

        flujo.setTipoNivel(request.getTipo_nivel());
        flujo.setNivel(request.getNivel());
        flujo.setUsuarios(request.getUsuarios());
        flujo.setExpedienteId(request.getExpediente_id());
        flujo.setDocumentosId(request.getDocumentos_id());
        flujo.setFechaLimite(request.getFecha_limite());
        flujo.setEstado(request.getEstado());
        flujoProcesoRepository.save(flujo);

       return sincronizarEstadoFirma(id);


    }
    @Transactional
    public void observarYEliminarNivel(Long flujoId, String comentario) {
        FlujoProceso flujo = flujoProcesoRepository.findById(flujoId)
                .orElseThrow(() -> new RuntimeException("Flujo no encontrado"));

        Long expedienteId = flujo.getExpedienteId();
        String documentosId = flujo.getDocumentosId();

        // 1️⃣ Registrar observación
        ObservacionEmisor observacion = new ObservacionEmisor();
        observacion.setFlujoId(flujoId);
        observacion.setExpedienteId(expedienteId);
        observacion.setDocumentosId(documentosId);
        observacion.setComentario(comentario);
        observacion.setFecha(LocalDateTime.now());
        observacionEmisorRepository.save(observacion);

        // 2️⃣ Buscar flujos relacionados
        List<FlujoProceso> relacionados = flujoProcesoRepository.findByExpedienteId(expedienteId)
                .stream()
                .filter(f -> {
                    if ("General".equalsIgnoreCase(f.getTipoNivel())) {
                        Set<String> docsA = new HashSet<>(Arrays.asList(f.getDocumentosId().split("\\|")));
                        Set<String> docsB = new HashSet<>(Arrays.asList(documentosId.split("\\|")));
                        docsA.retainAll(docsB);
                        return !docsA.isEmpty();
                    } else {
                        return f.getDocumentosId().equals(documentosId);
                    }
                })
                .collect(Collectors.toList());

        // Guardar lista de usuarios antes de eliminar (para correo)
        Set<String> usuariosAfectadosIds = relacionados.stream()
                .flatMap(f -> Arrays.stream(f.getUsuarios().split("\\|")))
                .collect(Collectors.toSet());

        // 3️⃣ Eliminar flujos relacionados
        flujoProcesoRepository.deleteAll(relacionados);

        // 4️⃣ Actualizar estado del expediente
        List<FlujoProceso> flujosRestantes = flujoProcesoRepository.findByExpedienteId(expedienteId);
        boolean todosFirmados = flujosRestantes.stream()
                .allMatch(f -> "FIRMADO".equalsIgnoreCase(f.getEstado()));

        Expediente expediente = expedienteRepository.findById(expedienteId)
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado"));
        expediente.setEstado(todosFirmados ? "APROBADO" : "PENDIENTE");
        expedienteRepository.save(expediente);

        // 5️⃣ Enviar correos de notificación
        List<Usuario> usuariosAfectados = usuarioService.obtenerPorIdsSeparados(String.join("|", usuariosAfectadosIds));
        List<Usuario> destinatarios = usuarioService.obtenerPorIdsSeparados(expediente.getUsuariosDestinatarios());
        List<Documento> documentos = documentoService.obtenerPorIdsSeparados(documentosId);
        String nombreRemitente = expediente.getCreadoPor() != null
                ? usuarioService.obtenerPorId(expediente.getCreadoPor()).map(Usuario::getNombre).orElse("Sistema")
                : "Sistema";

        for (Usuario usuario : usuariosAfectados) {
            String mensaje = emailService.generarMensajeObservacionUsuario(
                    usuario.getNombre(), expediente, documentos, comentario, nombreRemitente
            );
            emailService.enviarCorreoConAdjunto(
                    List.of(usuario.getCorreo()),
                    "Expediente observado – " + expediente.getCodigo(),
                    mensaje
            );
        }

        for (Usuario dest : destinatarios) {
            String mensaje = emailService.generarMensajeObservacionDestinatario(
                    dest.getNombre(), expediente, documentos, comentario, nombreRemitente
            );
            emailService.enviarCorreoConAdjunto(
                    List.of(dest.getCorreo()),
                    "Expediente observado – " + expediente.getCodigo(),
                    mensaje
            );
        }
    }


    public FlujoProceso sincronizarEstadoFirma(Long flujoId) {
        FlujoProceso flujo = flujoProcesoRepository.findById(flujoId)
                .orElseThrow(() -> new RuntimeException("Flujo no encontrado"));

        List<String> usuarios = Arrays.asList(flujo.getUsuarios().split("\\|"));

        // === Limpiar firmantes que ya no son usuarios
        List<String> firmantesOriginal = flujo.getUsuariosFirmantes() == null || flujo.getUsuariosFirmantes().isBlank()
                ? new ArrayList<>()
                : new ArrayList<>(Arrays.asList(flujo.getUsuariosFirmantes().split("\\|")));

        List<String> firmantesValidos = firmantesOriginal.stream()
                .filter(usuarios::contains)
                .distinct()
                .collect(Collectors.toList());

        flujo.setUsuariosFirmantes(String.join("|", firmantesValidos));

        // === Solo para tipo General: limpiar documentosFirmados
        List<String> documentosValidos = flujo.getTipoNivel().equalsIgnoreCase("General")
                ? Arrays.asList(flujo.getDocumentosId().split("\\|"))
                : List.of();

        List<String> documentosFirmadosOriginal = flujo.getDocumentosFirmados() == null || flujo.getDocumentosFirmados().isBlank()
                ? new ArrayList<>()
                : new ArrayList<>(Arrays.asList(flujo.getDocumentosFirmados().split("\\|")));

        List<String> documentosFirmadosValidos = documentosFirmadosOriginal.stream()
                .filter(documentosValidos::contains)
                .distinct()
                .collect(Collectors.toList());

        flujo.setDocumentosFirmados(String.join("|", documentosFirmadosValidos));

        // === Determinar estado del flujo ===
        boolean todosUsuariosFirmaron = firmantesValidos.size() == usuarios.size();
        boolean todosDocsFirmados = flujo.getTipoNivel().equalsIgnoreCase("General")
                ? documentosFirmadosValidos.size() == documentosValidos.size()
                : true;

        boolean cambioAFirmado = false;
        boolean cambioAPendiente = false;

        if (todosUsuariosFirmaron && todosDocsFirmados) {
            if (!"FIRMADO".equalsIgnoreCase(flujo.getEstado())) cambioAFirmado = true;
            flujo.setEstado("FIRMADO");
        } else {
            if ("FIRMADO".equalsIgnoreCase(flujo.getEstado())) cambioAPendiente = true;
            flujo.setEstado("PENDIENTE");
        }

        flujoProcesoRepository.save(flujo);

        // === Evaluar estado global del expediente
        Long expedienteId = flujo.getExpedienteId();
        List<FlujoProceso> flujos = flujoProcesoRepository.findByExpedienteId(expedienteId);
        boolean todosFirmados = flujos.stream().allMatch(f -> "FIRMADO".equalsIgnoreCase(f.getEstado()));

        expedienteRepository.findById(expedienteId).ifPresent(exp -> {
            boolean estabaAprobado = "APROBADO".equalsIgnoreCase(exp.getEstado());
            exp.setEstado(todosFirmados ? "APROBADO" : "PENDIENTE");
            expedienteRepository.save(exp);

            // === Email: si bajó de APROBADO a PENDIENTE
            if (estabaAprobado && !todosFirmados) {
                List<Usuario> destinatarios = usuarioService.obtenerPorIdsSeparados(exp.getUsuariosDestinatarios());
                for (Usuario destinatario : destinatarios) {
                    String mensaje = emailService.generarMensajePendiente(destinatario.getNombre(), exp);
                    emailService.enviarCorreoConAdjunto(
                            List.of(destinatario.getCorreo()),
                            "Expediente pendiente nuevamente – " + exp.getCodigo(),
                            mensaje
                    );
                }
            }

            // === Email: si subió de PENDIENTE a APROBADO
            if (!estabaAprobado && todosFirmados) {
                List<Usuario> destinatarios = usuarioService.obtenerPorIdsSeparados(exp.getUsuariosDestinatarios());
                List<Documento> documentos = documentoService.obtenerPorExpedienteId(expedienteId);
                String nombreRemitente = "Sistema";

                if (exp.getCreadoPor() != null) {
                    Usuario creador = usuarioService.obtenerPorId(exp.getCreadoPor()).orElse(null);
                    if (creador != null) nombreRemitente = creador.getNombre();
                }

                for (Usuario destinatario : destinatarios) {
                    String mensaje = emailService.generarMensajeAprobacion(exp, documentos, nombreRemitente);
                    emailService.enviarCorreoConAdjunto(
                            List.of(destinatario.getCorreo()),
                            "Expediente aprobado – " + exp.getCodigo(),
                            mensaje
                    );
                }
            }
        });

        // === Email: si el flujo cambió a PENDIENTE (nuevo nivel)
        if (cambioAPendiente) {
            List<Usuario> nuevos = usuarioService.obtenerPorIdsSeparados(flujo.getUsuarios());
            Expediente expediente = expedienteService.obtenerPorId(expedienteId)
                    .orElseThrow(() -> new RuntimeException("Expediente no encontrado"));
            List<Documento> documentos = documentoService.obtenerPorIdsSeparados(flujo.getDocumentosId());

            String nombreRemitente = "Sistema";
            if (expediente.getCreadoPor() != null) {
                Usuario creador = usuarioService.obtenerPorId(expediente.getCreadoPor()).orElse(null);
                if (creador != null) nombreRemitente = creador.getNombre();
            }

            for (Usuario usuario : nuevos) {
                String mensaje = emailService.generarMensajeFirma(
                        usuario.getNombre(),
                        expediente,
                        documentos,
                        flujo.getNivel(),
                        flujo.getFechaLimite().format(DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy")),
                        nombreRemitente
                );
                emailService.enviarCorreoConAdjunto(
                        List.of(usuario.getCorreo()),
                        "Firma requerida – " + expediente.getCodigo(),
                        mensaje
                );
            }
        }

        return flujo;
    }


    @Override
    public List<Documento> obtenerDocumentosPendientesParaFirmar(Long expedienteId, Long usuarioId) {
        List<FlujoProceso> flujos = flujoProcesoRepository.findByExpedienteIdAndEstado(expedienteId, "PENDIENTE");
        List<Documento> documentosParaFirmar = new ArrayList<>();

        for (FlujoProceso flujo : flujos) {
            List<String> idsUsuarios = Arrays.asList(flujo.getUsuarios().split("\\|"));
            if (!idsUsuarios.contains(usuarioId.toString())) continue;
            System.out.println("→ Evaluando flujo ID: " + flujo.getId() + " - Nivel: " + flujo.getNivel());

            System.out.println("→ Usuarios en flujo: " + flujo.getUsuarios());
            System.out.println("→ Usuario actual: " + usuarioId);
            System.out.println("→ Nivel: " + flujo.getNivel());
            // Si el nivel es mayor a 1, verificar que todos los flujos del nivel anterior estén firmados
            if (flujo.getNivel() > 1) {
                List<FlujoProceso> anteriores;

                if ("General".equalsIgnoreCase(flujo.getTipoNivel())) {
                    anteriores = flujoProcesoRepository.findByExpedienteIdAndNivelAndTipoNivel(
                            expedienteId, flujo.getNivel() - 1, "General"
                    );
                } else {
                    anteriores = flujoProcesoRepository.findByExpedienteIdAndNivelAndDocumentosId(
                            expedienteId, flujo.getNivel() - 1, flujo.getDocumentosId()
                    );
                }

                boolean todosFirmados = anteriores.stream().allMatch(f -> "FIRMADO".equals(f.getEstado()));
                if (!todosFirmados) continue;
            }

            if ("General".equalsIgnoreCase(flujo.getTipoNivel())) {
                List<Documento> docs = documentoService.obtenerPorIdsSeparados(flujo.getDocumentosId());
                for (Documento doc : docs) {
                    // Añadimos metadata del flujo manualmente usando atributos dinámicos o setX
                    doc.setTipoDocumento(doc.getTipoDocumento() + "|" + flujo.getId());
                    documentosParaFirmar.add(doc);
                }
            } else {
                Optional<Documento> optionalDoc = documentoService.obtenerPorId(Long.parseLong(flujo.getDocumentosId()));
                if (optionalDoc.isPresent()) {
                    Documento doc = optionalDoc.get();
                    doc.setTipoDocumento(doc.getTipoDocumento() + "|" + flujo.getId());
                    documentosParaFirmar.add(doc);
                }
            }
        }


        return documentosParaFirmar;
    }
    @Override
    public Optional<FlujoProceso> obtenerPorId(Long id) {
        return flujoProcesoRepository.findById(id);
    }

    @Override
    public List<Long> obtenerExpedientesIdPorUsuarioFirmante(String usuarioId) {
        String match = "|" + usuarioId + "|";
        return flujoProcesoRepository.findExpedientesIdPorUsuarioFirmante(match);
    }
    public List<Long> obtenerExpedientesIdPorUsuarioFirmanteCondicionado(Long usuarioId) {
        List<FlujoProceso> flujosUsuario = flujoProcesoRepository.findByUsuarioAsignado(String.valueOf(usuarioId));

        Set<Long> expedientesValidos = new HashSet<>();

        for (FlujoProceso flujo : flujosUsuario) {
            if (!flujo.getEstado().equalsIgnoreCase("PENDIENTE")) continue;

            int nivel = flujo.getNivel();
            Long expedienteId = flujo.getExpedienteId();

            // Si es nivel 1 no necesita validación
            if (nivel == 1) {
                expedientesValidos.add(expedienteId);
                continue;
            }

            // Buscar si el nivel anterior está firmado
            Optional<FlujoProceso> anterior = flujoProcesoRepository
                    .findByExpedienteIdAndNivel(expedienteId, nivel - 1)
                    .stream()
                    .filter(f -> f.getEstado().equalsIgnoreCase("FIRMADO"))
                    .findFirst();

            if (anterior.isPresent()) {
                expedientesValidos.add(expedienteId);
            }
        }

        return new ArrayList<>(expedientesValidos);
    }


}