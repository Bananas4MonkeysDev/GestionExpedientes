package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.dto.CargoRequestDTO;
import com.example.gestionexpedientesbackend.model.Cargo;
import com.example.gestionexpedientesbackend.model.Documento;
import com.example.gestionexpedientesbackend.model.Expediente;
import com.example.gestionexpedientesbackend.model.Usuario;
import com.example.gestionexpedientesbackend.repository.CargoRepository;
import com.example.gestionexpedientesbackend.service.CargoService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class CargoServiceImpl implements CargoService {

    private final CargoRepository cargoRepository;
    private static final String UPLOAD_DIR = "C:\\Users\\Usuario\\Desktop\\CargoUploads\\";
    private EmailService emailService;

    private ExpedienteService expedienteService;
    private final DocumentoService documentoService;

    private UsuarioService usuarioService;

    public CargoServiceImpl(
            CargoRepository cargoRepository,
            ExpedienteService expedienteService,
            UsuarioService usuarioService,
            EmailService emailService,
            DocumentoService documentoService
    ) {
        this.cargoRepository = cargoRepository;
        this.expedienteService = expedienteService;
        this.usuarioService = usuarioService;
        this.emailService = emailService;
        this.documentoService = documentoService; //
    }

    @Override
    public Cargo obtenerPorId(Long id) {

        return cargoRepository.findById(id).orElse(null);
    }

    // Ahora el archivo es un parámetro aparte, no parte del DTO
    // Obtener expediente
    @Override
    public Cargo obtenerPorExpedienteId(Long expedienteId) {
        // antes (ERROR si hay 2 o más resultados)
        // return cargoRepository.findByExpedienteId(expedienteId);

        // ahora (agarra el más reciente por orden)
        List<Cargo> cargos = cargoRepository.findAllByExpedienteIdOrderByOrdenDesc(expedienteId);
        return cargos.isEmpty() ? null : cargos.get(0);
    }

    @Override
    public List<Cargo> obtenerHistorialPorExpediente(Long expedienteId) {
        return cargoRepository.findByExpedienteIdOrderByOrdenDesc(expedienteId);
    }
    @Override
    public Cargo obtenerPorUuid(String uuid) {
        return cargoRepository.findByUuid(uuid);
    }
    @Transactional
    public Cargo crearCargo(CargoRequestDTO cargoRequest, MultipartFile archivo) throws IOException {
        if (cargoRequest.getFecha() == null)
            throw new IllegalArgumentException("La fecha es obligatoria");
        if (cargoRequest.getHora() == null)
            throw new IllegalArgumentException("La hora es obligatoria");
        if (cargoRequest.getExpedienteId() == null)
            throw new IllegalArgumentException("El expedienteId es obligatorio");

        Cargo cargo = new Cargo();
        cargo.setUsuarioCreadorId(cargoRequest.getUsuarioCreadorId());
        cargo.setFecha(cargoRequest.getFecha());
        cargo.setHora(cargoRequest.getHora());
        cargo.setExpedienteId(cargoRequest.getExpedienteId());
        Integer ultimoOrden = cargoRepository.findByExpedienteIdOrderByOrdenDesc(cargoRequest.getExpedienteId())
                .stream().findFirst().map(Cargo::getOrden).orElse(0);
        cargo.setOrden(ultimoOrden + 1);
        cargo.setUuid(UUID.randomUUID().toString());

        // Guardar primero para generar ID y código
        cargo = cargoRepository.save(cargo);  // El ID se genera automáticamente por la base de datos
        String codigoGenerado = String.format("CAR-%06d", cargo.getId());  // Usa el ID para generar el código
        cargo.setCodigo(codigoGenerado);

        // Guardar archivo físico si existe
        if (archivo != null && !archivo.isEmpty()) {
            String nombreArchivo = codigoGenerado + ".pdf";
            File destino = new File(UPLOAD_DIR + nombreArchivo);
            archivo.transferTo(destino);
            cargo.setArchivoPath(destino.getAbsolutePath());
        }
        String nombreRemitente = "Sistema";
        if (cargo.getUsuarioCreadorId() != null) {
            Usuario creador = usuarioService.obtenerPorId(cargo.getUsuarioCreadorId()).orElse(null);
            if (creador != null) {
                nombreRemitente = creador.getNombre();
            }
        }

        Expediente exp = expedienteService.obtenerPorId(cargoRequest.getExpedienteId()).orElseThrow();
        List<Usuario> emisores = usuarioService.obtenerPorIdsSeparados(exp.getUsuariosEmisores());
        List<String> correos = emisores.stream().map(Usuario::getCorreo).toList();

        List<Documento> documentos = documentoService.obtenerPorExpedienteId(exp.getId());

        String mensaje = emailService.generarMensajeCargo(cargo, documentos, exp, nombreRemitente);

        File adjunto = cargo.getArchivoPath() != null ? new File(cargo.getArchivoPath()) : null;
        emailService.enviarCorreoConAdjunto(correos, "Cargo generado – " + cargo.getCodigo(), mensaje);

        // Guardar nuevamente con código, ruta y mensaje actualizados
        return cargoRepository.save(cargo);
    }

}
