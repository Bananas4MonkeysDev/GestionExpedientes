package com.example.gestionexpedientesbackend.model;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "grupos_areas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrupoArea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    private String descripcion;

    private String tipo; // "Grupo" o "Área"

    @Column(name = "usuarios_ids")
    private String usuariosIds;
}