package com.example.gestionexpedientesbackend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    @Column(unique = true)
    private String correo;

    private String contraseña;

    @Enumerated(EnumType.STRING)
    private TipoUsuario tipoUsuario;  // INTERNO o EXTERNO

    @Enumerated(EnumType.STRING)
    private TipoIdentidad tipoIdentidad; // PERSONA o ENTIDAD

    private String ruc; // opcional, para entidades
    private String rol;
    private String dni;

    public String getDni() {
        return dni;
    }

    public void setDni(String dni) {
        this.dni = dni;
    }
// Getters y Setters

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getContraseña() {
        return contraseña;
    }

    public void setContraseña(String contraseña) {
        this.contraseña = contraseña;
    }

    public TipoUsuario getTipoUsuario() {
        return tipoUsuario;
    }

    public void setTipoUsuario(TipoUsuario tipoUsuario) {
        this.tipoUsuario = tipoUsuario;
    }

    public TipoIdentidad getTipoIdentidad() {
        return tipoIdentidad;
    }

    public void setTipoIdentidad(TipoIdentidad tipoIdentidad) {
        this.tipoIdentidad = tipoIdentidad;
    }

    public String getRuc() {
        return ruc;
    }

    public void setRuc(String ruc) {
        this.ruc = ruc;
    }
}
