package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.model.Documento;
import com.example.gestionexpedientesbackend.model.Expediente;
import com.example.gestionexpedientesbackend.repository.DocumentoRepository;
import com.example.gestionexpedientesbackend.repository.ExpedienteRepository;
import com.example.gestionexpedientesbackend.service.DocumentoService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
@Service
public class DocumentoServiceImpl implements DocumentoService {

    private final String uploadPath = "C:\\Users\\Usuario\\Desktop\\ExpedientesUploads"; // cambia según tu entorno

    @Autowired
    private ExpedienteRepository expedienteRepository;

    @Autowired
    private DocumentoRepository documentoRepository;

    @Override
    @Transactional
    public Documento guardarDocumento(MultipartFile file, Long expedienteId, String tipoDocumento, boolean visible) throws IOException {
        System.out.println("→ Guardando documento en DocumentoService");
        System.out.println("→ Expediente ID: " + expedienteId);
        System.out.println("→ Nombre archivo: " + file.getOriginalFilename());
        System.out.println("→ Visible: " + visible);
        Expediente expediente = expedienteRepository.findById(expedienteId)
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado"));

        // 1. Guardar temporalmente el archivo en disco
        String nombreOriginal = file.getOriginalFilename();
        String nombreArchivoFinal = System.currentTimeMillis() + "_" + nombreOriginal;
        String ruta = uploadPath + File.separator + nombreArchivoFinal;

        File archivoDestino = new File(ruta);
        file.transferTo(archivoDestino);

        // 2. Crear el objeto sin el código
        Documento doc = new Documento();
        doc.setNombreArchivo(nombreOriginal);
        doc.setRutaArchivo(ruta);
        doc.setTipoDocumento(tipoDocumento);
        doc.setTamaño(file.getSize());
        doc.setVisibleParaExternos(visible);
        doc.setExpediente(expediente);

        // 3. Guardar primero para obtener su ID (evita conflictos de conteo en concurrencia)
        Documento guardado = documentoRepository.save(doc);

        // 4. Generar el código con base en el ID ya asignado
        String codigoGenerado = String.format("DOC-%06d", guardado.getId());  // Usa el ID para generar el código
        guardado.setCodigo(codigoGenerado);

        // 5. Guardar nuevamente solo si el código cambió
        return documentoRepository.save(guardado);
    }
    @Override
    public Optional<Documento> obtenerPorId(Long id) {
        return documentoRepository.findById(id);
    }
    @Override
    public List<Documento> obtenerPorIdsSeparados(String idsSeparadosPorPipe) {
        String[] partes = idsSeparadosPorPipe.split("\\|");
        List<Long> ids = new ArrayList<>();
        for (String parte : partes) {
            try {
                ids.add(Long.parseLong(parte));
            } catch (NumberFormatException e) {
                // Ignorar si no es número
            }
        }
        return documentoRepository.findAllById(ids);
    }

    @Override
    @Transactional
    public void eliminarPorId(Long id) {
        documentoRepository.deleteById(id);
    }
    @Override
    @Transactional
    public Documento actualizarDocumento(Documento documento) {
        // Simplemente guarda la entidad actualizada
        return documentoRepository.save(documento);
    }

    @Override
    public List<Documento> obtenerPorExpedienteId(Long expedienteId) {
        return documentoRepository.findByExpedienteId(expedienteId);
    }

}
