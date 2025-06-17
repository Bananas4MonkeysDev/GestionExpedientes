package com.example.gestionexpedientesbackend.service.OCR;
import com.example.gestionexpedientesbackend.config.MultipartInputStreamFileResource;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class OCRService {

    private final WebClient webClient;

    public OCRService(WebClient.Builder builder) {
        this.webClient = builder.baseUrl("http://localhost:8000").build(); // Cambia si deployas
    }
    public byte[] obtenerImagenDesdePDF(MultipartFile file, int page) throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new MultipartInputStreamFileResource(file.getInputStream(), file.getOriginalFilename()));
        body.add("page", String.valueOf(page));

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<byte[]> response = new RestTemplate().postForEntity(
                "http://localhost:8000/pdf-to-image/", requestEntity, byte[].class
        );

        return response.getBody();
    }

    public String enviarAOcrPython(MultipartFile file, double x, double y, double width, double height, int page) throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new MultipartInputStreamFileResource(file.getInputStream(), file.getOriginalFilename()));
        body.add("x", String.valueOf(x));
        body.add("y", String.valueOf(y));
        body.add("width", String.valueOf(width));
        body.add("height", String.valueOf(height));
        body.add("page", String.valueOf(page)); // <- este campo es OBLIGATORIO

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        String pythonUrl = "http://localhost:8000/ocr/pdf/region/";

        RestTemplate restTemplate = new RestTemplate();
        return restTemplate.postForObject(pythonUrl, requestEntity, String.class);
    }


    public String extraerTexto(MultipartFile file) {
        try {
            return this.webClient.post()
                    .uri("/ocr/pdf/")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData("file", new ByteArrayResource(file.getBytes()) {
                        @Override
                        public String getFilename() {
                            return file.getOriginalFilename();
                        }
                    }))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
        } catch (Exception e) {
            throw new RuntimeException("Error al comunicarse con el servicio OCR", e);
        }
    }
}
