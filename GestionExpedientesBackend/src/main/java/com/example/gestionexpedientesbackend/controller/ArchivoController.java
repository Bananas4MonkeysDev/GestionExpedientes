package com.example.gestionexpedientesbackend.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/archivos")
public class ArchivoController {

    @GetMapping("/abrir")
    public ResponseEntity<Resource> abrirArchivo(@RequestParam("ruta") String ruta) {
        try {
            File archivo = new File(ruta);

            if (!archivo.exists() || !archivo.isFile()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(null);
            }

            String mimeType = Files.probeContentType(Paths.get(ruta));
            if (mimeType == null) mimeType = "application/octet-stream";

            Resource recurso = new FileSystemResource(archivo);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(mimeType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + archivo.getName() + "\"")
                    .body(recurso);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
