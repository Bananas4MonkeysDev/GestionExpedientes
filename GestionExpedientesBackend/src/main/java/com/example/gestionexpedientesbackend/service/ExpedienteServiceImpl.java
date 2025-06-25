package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.dto.ExpedienteDTO;
import com.example.gestionexpedientesbackend.dto.ExpedienteDetalleResponseDTO;
import com.example.gestionexpedientesbackend.model.Cargo;
import com.example.gestionexpedientesbackend.model.Documento;
import com.example.gestionexpedientesbackend.model.Expediente;
import com.example.gestionexpedientesbackend.model.Usuario;
import com.example.gestionexpedientesbackend.repository.ExpedienteRepository;
import com.example.gestionexpedientesbackend.service.ExpedienteService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ExpedienteServiceImpl implements ExpedienteService {

    @Autowired
    private ExpedienteRepository expedienteRepository;

    @Autowired
    private DocumentoService documentoService;
    @Autowired
    private EmailService emailService;

    private CargoService cargoService;

    @Autowired
    public void setCargoService(@Lazy CargoService cargoService) {
        this.cargoService = cargoService;
    }
    @Autowired
    private UsuarioService usuarioService;
    @Override
    public Optional<Expediente> obtenerPorId(Long id) {
        return expedienteRepository.findById(id);
    }

    @Override
    public List<Expediente> obtenerTodos() {
        return expedienteRepository.findAll();
    }

    @Override
    public List<Expediente> obtenerPorUsuario(Long usuarioId) {
        String target = "|" + usuarioId + "|";
        return expedienteRepository.findAll().stream()
                .filter(e -> ("|" + e.getUsuariosEmisores() + "|").contains(target) ||
                             ("|" + e.getUsuariosDestinatarios() + "|").contains(target))
                .toList();
    }
    @Override
    public void marcarComoLeido(Long id) {
        Expediente expediente = expedienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado"));
        expediente.setLeido(true);
        expedienteRepository.save(expediente);
    }
    @Override
    public void cambiarEstadoConFecha(Long id, String estado, String fechaLimiteStr) throws Exception {
        Optional<Expediente> optional = expedienteRepository.findById(id);
        if (optional.isEmpty()) {
            throw new Exception("Expediente no encontrado");
        }

        Expediente expediente = optional.get();
        expediente.setEstado(estado);

        if (fechaLimiteStr != null && !fechaLimiteStr.isEmpty()) {
            LocalDate fechaLimite = LocalDate.parse(fechaLimiteStr);
            expediente.setFechaLimiteRespuesta(fechaLimite); // Asegúrate de tener este campo
        }

        expedienteRepository.save(expediente);
    }

    @Override
    public void marcarComoDesechado(Long id) {
        Expediente expediente = expedienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado"));
        expediente.setDesechado(true);
        expedienteRepository.save(expediente);
    }

    @Override
    public void archivarExpediente(Long id) {
        Expediente expediente = expedienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado"));
        expediente.setArchivado(true);
        expedienteRepository.save(expediente);
    }
    @Override
    public ExpedienteDetalleResponseDTO obtenerDetalleExpediente(Long id) {
        Optional<Expediente> optionalExp = expedienteRepository.findById(id);
        if (optionalExp.isEmpty()) {
            return null;
        }
        Expediente expediente = optionalExp.get();
        List<Documento> documentos = documentoService.obtenerPorExpedienteId(id);
        Cargo cargo = cargoService.obtenerPorExpedienteId(id);
        List<Usuario> emisores = usuarioService.obtenerPorIdsSeparados(expediente.getUsuariosEmisores());
        List<Usuario> destinatarios = usuarioService.obtenerPorIdsSeparados(expediente.getUsuariosDestinatarios());

        // Convertir ruta local a URL si existe
        if (cargo != null && cargo.getArchivoPath() != null) {
            String rawPath = cargo.getArchivoPath();
            if (rawPath.contains("\\")) {
                String filename = rawPath.substring(rawPath.lastIndexOf("\\") + 1);
                cargo.setArchivoPath("http://localhost:8080/files/" + filename);
            }
        }

        ExpedienteDetalleResponseDTO dto = new ExpedienteDetalleResponseDTO();
        dto.setExpediente(expediente);
        dto.setDocumentos(documentos);
        dto.setCargo(cargo);
        dto.setUsuariosEmisores(emisores);
        dto.setUsuariosDestinatarios(destinatarios);

        return dto;
    }

    @Override
    public void actualizar(Long id, ExpedienteDTO datosActualizados) {
        Expediente expediente = expedienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado"));

        expediente.setAsunto(datosActualizados.getAsunto());
        expediente.setFecha(datosActualizados.getFecha());
        expediente.setProyecto(datosActualizados.getProyecto());
        expediente.setComentario(datosActualizados.getComentario());
        expediente.setReservado(datosActualizados.isReservado());
        expediente.setUsuariosEmisores(datosActualizados.getUsuariosEmisores());
        expediente.setUsuariosDestinatarios(datosActualizados.getUsuariosDestinatarios());
        expediente.setReferencias(datosActualizados.getReferencias());

        expedienteRepository.save(expediente);
    }
    @Transactional
    public Expediente registrarExpediente(Expediente expediente) {
        expediente.setEstado("PENDIENTE");
        // Primero guardar sin código
        expediente = expedienteRepository.save(expediente);

        // Generar el código basado en el ID ya asignado
        String codigo = String.format("EXP-%06d", expediente.getId());  // Esto usa el ID generado por la DB
        expediente.setCodigo(codigo);
        // Obtener destinatarios
        List<Usuario> destinatarios = usuarioService.obtenerPorIdsSeparados(expediente.getUsuariosDestinatarios());
        List<String> correos = destinatarios.stream().map(Usuario::getCorreo).toList();

    // Obtener documentos
        List<Documento> documentos = documentoService.obtenerPorExpedienteId(expediente.getId());


        // Volver a guardar con el código actualizado, sin cambiar el ID
        return expedienteRepository.save(expediente);
    }
    @Override
    public void cambiarEstado(Long id, String nuevoEstado) {
        Expediente expediente = expedienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado"));

        expediente.setEstado(nuevoEstado);
        expedienteRepository.save(expediente);
    }


    public void notificarRegistroExpediente(Long expedienteId, boolean conDocumentos) {
        Expediente expediente = expedienteRepository.findById(expedienteId).orElseThrow();
        List<Usuario> destinatarios = usuarioService.obtenerPorIdsSeparados(expediente.getUsuariosDestinatarios());
        List<String> correos = destinatarios.stream().map(Usuario::getCorreo).toList();

        List<Documento> documentos = conDocumentos
                ? documentoService.obtenerPorExpedienteId(expedienteId)
                : List.of(); // lista vacía
        String nombreRemitente = "Sistema";
        if (expediente.getCreadoPor() != null) {
            Optional<Usuario> creador = usuarioService.obtenerPorId(expediente.getCreadoPor());
            nombreRemitente = creador.map(Usuario::getNombre).orElse("Sistema");
        }
        String mensaje = emailService.generarMensajeExpediente(expediente, documentos, nombreRemitente);
        emailService.enviarCorreoConAdjunto(correos, "Nuevo expediente registrado – " + expediente.getCodigo(), mensaje);
    }
}
