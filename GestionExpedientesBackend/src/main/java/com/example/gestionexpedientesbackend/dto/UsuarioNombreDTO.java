package com.example.gestionexpedientesbackend.dto;

public class UsuarioNombreDTO {
    private Long id;
    private String nombre;

    public UsuarioNombreDTO(Long id, String nombre) {
        this.id = id;
        this.nombre = nombre;
    }

    public Long getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }
}
