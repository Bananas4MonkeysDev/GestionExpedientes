package com.example.gestionexpedientesbackend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class FlujoProcesoRequest {
    private String tipo_nivel;
    private Integer nivel;
    private String usuarios; // en formato "3|4|7"
    private Long expediente_id;
    private String documentos_id; // en formato "12|15" o "12"
    private LocalDate fecha_limite;
    private String estado;
    private String modoConexion;
}