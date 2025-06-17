package com.example.gestionexpedientesbackend.controller;

import com.example.gestionexpedientesbackend.service.OCR.OCRService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
@RestController
@RequestMapping("/api/ocr")
public class OCRController {
    private static final Logger logger = LoggerFactory.getLogger(OCRController.class);

    private final OCRService ocrService;

    public OCRController(OCRService ocrService) {
        this.ocrService = ocrService;
    }
    @PostMapping("/imagen-pdf")
    public ResponseEntity<byte[]> obtenerImagenPDF(
            @RequestParam("file") MultipartFile file,
            @RequestParam("page") int page) {
        logger.info("📥 Recibido archivo PDF: {}", file.getOriginalFilename());
        logger.info("📄 Página solicitada: {}", page);

        try {
            byte[] imagen = ocrService.obtenerImagenDesdePDF(file, page);
            logger.info("✅ Imagen recibida desde servicio OCR (FastAPI). Tamaño: {} bytes", imagen.length);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(imagen);
        } catch (Exception e) {
            logger.error("❌ Error al obtener imagen desde servicio OCR: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/extraer-region")
    public ResponseEntity<?> extraerTextoConRegion(
            @RequestParam("file") MultipartFile file,
            @RequestParam("x") double x,
            @RequestParam("y") double y,
            @RequestParam("width") double width,
            @RequestParam("height") double height,
            @RequestParam("page") int page // <- ¡nuevo!
    ) {
        try {
            String resultado = ocrService.enviarAOcrPython(file, x, y, width, height, page);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }


    @PostMapping("/extraer")
    public ResponseEntity<?> extraerTexto(@RequestParam("file") MultipartFile file) {
        String resultado = ocrService.extraerTexto(file);
        return ResponseEntity.ok(resultado);
    }
}