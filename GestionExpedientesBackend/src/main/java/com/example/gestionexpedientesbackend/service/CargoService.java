package com.example.gestionexpedientesbackend.service;

import com.example.gestionexpedientesbackend.dto.CargoRequestDTO;
import com.example.gestionexpedientesbackend.model.Cargo;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface CargoService {
    Cargo crearCargo(CargoRequestDTO cargoRequest, MultipartFile archivo) throws IOException;
}
