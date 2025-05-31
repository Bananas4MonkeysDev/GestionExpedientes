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
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ExpedienteServiceImpl implements ExpedienteService {

    @Autowired
    private ExpedienteRepository expedienteRepository;

    @Autowired
    private DocumentoService documentoService;

    @Autowired
    private CargoService cargoService;

    @Autowired
    private UsuarioService usuarioService;
    @Override
    public Optional<Expediente> obtenerPorId(Long id) {
        return expedienteRepository.findById(id);
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
        // Primero guardar sin código
        expediente = expedienteRepository.save(expediente);

        // Generar el código basado en el ID ya asignado
        String codigo = String.format("EXP-%06d", expediente.getId());  // Esto usa el ID generado por la DB
        expediente.setCodigo(codigo);

        // Volver a guardar con el código actualizado, sin cambiar el ID
        return expedienteRepository.save(expediente);
    }

}
