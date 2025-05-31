package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.dto.CargoRequestDTO;
import com.example.gestionexpedientesbackend.model.Cargo;
import com.example.gestionexpedientesbackend.repository.CargoRepository;
import com.example.gestionexpedientesbackend.service.CargoService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class CargoServiceImpl implements CargoService {

    private final CargoRepository cargoRepository;
    private static final String UPLOAD_DIR = "C:\\Users\\Usuario\\Desktop\\CargoUploads\\";

    public CargoServiceImpl(CargoRepository cargoRepository) {
        this.cargoRepository = cargoRepository;
    }

    // Ahora el archivo es un parámetro aparte, no parte del DTO
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

    @Transactional
    public Cargo crearCargo(CargoRequestDTO cargoRequest, MultipartFile archivo) throws IOException {
        if (cargoRequest.getFecha() == null)
            throw new IllegalArgumentException("La fecha es obligatoria");
        if (cargoRequest.getHora() == null)
            throw new IllegalArgumentException("La hora es obligatoria");
        if (cargoRequest.getExpedienteId() == null)
            throw new IllegalArgumentException("El expedienteId es obligatorio");

        Cargo cargo = new Cargo();
        cargo.setFecha(cargoRequest.getFecha());
        cargo.setHora(cargoRequest.getHora());
        cargo.setExpedienteId(cargoRequest.getExpedienteId());
        Integer ultimoOrden = cargoRepository.findByExpedienteIdOrderByOrdenDesc(cargoRequest.getExpedienteId())
                .stream().findFirst().map(Cargo::getOrden).orElse(0);
        cargo.setOrden(ultimoOrden + 1);

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

        // Generar mensaje automático con datos ya completos
        String mensajeGenerado = generarMensaje(cargo);
        cargo.setMensaje(mensajeGenerado);

        // Guardar nuevamente con código, ruta y mensaje actualizados
        return cargoRepository.save(cargo);
    }

    private String generarMensaje(Cargo cargo) {
        DateTimeFormatter df = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter hf = DateTimeFormatter.ofPattern("HH:mm");

        return String.format(
                "Asunto: Confirmación de recepción de documentos – Expediente %s\n\n" +
                        "Estimado(a),\n\n" +
                        "Por medio de la presente, le informamos que hemos recibido con éxito la solicitud con documentos adjuntos correspondientes al expediente identificado con el código de cargo %s.\n\n" +
                        "La recepción se realizó el día %s a las %s.\n\n" +
                        "Le notificamos que su envío será revisado a la brevedad posible y que recibirá una respuesta tan pronto se haya completado la evaluación correspondiente.\n\n" +
                        "Atentamente,\n\n" +
                        "[Nombre de la Persona que Firma]\n" +
                        "[Cargo]\n" +
                        "[Nombre de la Institución o Área]",
                cargo.getExpedienteId(),
                cargo.getCodigo(),
                cargo.getFecha().format(df),
                cargo.getHora().format(hf));
    }
}
