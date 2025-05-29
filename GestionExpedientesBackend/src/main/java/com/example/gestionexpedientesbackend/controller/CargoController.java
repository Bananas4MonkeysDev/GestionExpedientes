package com.example.gestionexpedientesbackend.controller;

import com.example.gestionexpedientesbackend.dto.CargoRequestDTO;
import com.example.gestionexpedientesbackend.model.Cargo;
import com.example.gestionexpedientesbackend.service.CargoService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/cargos")
public class CargoController {

    private final CargoService cargoService;

    public CargoController(CargoService cargoService) {
        this.cargoService = cargoService;
    }
    @PostMapping("/cargo")
    public ResponseEntity<Cargo> crearCargo(
            @RequestParam("fecha") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam("hora") @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime hora,
            @RequestParam("expedienteId") Long expedienteId,
            @RequestParam(value = "archivo", required = false) MultipartFile archivo) throws IOException {

        CargoRequestDTO dto = new CargoRequestDTO();
        dto.setFecha(fecha);
        dto.setHora(hora);
        dto.setExpedienteId(expedienteId);

        Cargo cargoCreado = cargoService.crearCargo(dto, archivo);

        return ResponseEntity.ok(cargoCreado);
    }

}
