package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.dto.CargoRequestDTO;
import com.example.gestionexpedientesbackend.model.Cargo;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface CargoService {
    Cargo crearCargo(CargoRequestDTO cargoRequest, MultipartFile archivo) throws IOException;
    Cargo obtenerPorExpedienteId(Long expedienteId);
    List<Cargo> obtenerHistorialPorExpediente(Long expedienteId);
    Cargo obtenerPorId(Long id);
    Cargo obtenerPorUuid(String uuid);

}
