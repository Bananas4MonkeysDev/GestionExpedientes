package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.dto.FlujoProcesoRequest;
import com.example.gestionexpedientesbackend.model.Documento;
import com.example.gestionexpedientesbackend.model.Expediente;
import com.example.gestionexpedientesbackend.model.FlujoProceso;
import com.example.gestionexpedientesbackend.model.Usuario;
import com.example.gestionexpedientesbackend.repository.FlujoProcesoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;


@Service
public class FlujoProcesoServiceImpl implements FlujoProcesoService {

    @Autowired
    private FlujoProcesoRepository flujoProcesoRepository;
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
        for (Usuario usuario : usuarios) {
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
            }/* else {
              mensaje = emailService.generarMensajeEspera(
                        usuario.getNombre(),
                        expediente,
                        flujo.getNivel(),
                        nombreRemitente
                );
                asunto = "Notificación de flujo – " + asunto;
            }*/

            emailService.enviarCorreoConAdjunto(
                    List.of(usuario.getCorreo()),
                    asunto,
                    mensaje
            );
        }

        return flujoProcesoRepository.save(flujo);
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

        return flujoProcesoRepository.save(flujo);
    }

    @Override
    public List<Documento> obtenerDocumentosPendientesParaFirmar(Long expedienteId, Long usuarioId) {
        List<FlujoProceso> flujos = flujoProcesoRepository.findByExpedienteIdAndEstado(expedienteId, "PENDIENTE");
        List<Documento> documentosParaFirmar = new ArrayList<>();

        for (FlujoProceso flujo : flujos) {
            List<String> idsUsuarios = Arrays.asList(flujo.getUsuarios().split("\\|"));
            if (!idsUsuarios.contains(usuarioId.toString())) continue;

            // Si el nivel es mayor a 1, verificar que todos los flujos del nivel anterior estén firmados
            if (flujo.getNivel() > 1) {
                List<FlujoProceso> anteriores = flujoProcesoRepository.findByExpedienteIdAndNivel(
                        expedienteId, flujo.getNivel() - 1
                );

                boolean todosFirmados = anteriores.stream().allMatch(f -> "FIRMADO".equals(f.getEstado()));
                if (!todosFirmados) continue;
            }

            if ("General".equalsIgnoreCase(flujo.getTipoNivel())) {
                documentosParaFirmar.addAll(documentoService.obtenerPorIdsSeparados(flujo.getDocumentosId()));
            } else {
                Optional<Documento> optionalDoc = documentoService.obtenerPorId(Long.parseLong(flujo.getDocumentosId()));
                optionalDoc.ifPresent(documentosParaFirmar::add);

            }
        }


        return documentosParaFirmar;
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