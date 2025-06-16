// src/app/modules/expedientes/modal/proyecto-agregar/proyecto-agregar.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ProyectoService } from '../../../../core/services/proyecto.service';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuditoriaService } from '../../../../core/services/auditoria.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-proyecto-agregar',
  templateUrl: './proyecto-agregar.component.html',
  standalone: true,
  imports: [MatIcon, FormsModule, MatFormFieldModule,
    MatInputModule,
    MatButtonModule, CommonModule, ReactiveFormsModule],
})
export class ProyectoAgregarComponent implements OnInit {
  formularioProyecto!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProyectoAgregarComponent>,
    private proyectoService: ProyectoService,
    private auditoriaService: AuditoriaService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.formularioProyecto = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required]
    });
  }
  cancelar() {
    this.dialogRef.close(null);
  }
  guardarProyecto() {
    if (this.formularioProyecto.invalid) return;

    const data = this.formularioProyecto.value;
    this.proyectoService.create(data).subscribe({
      next: (res) => {
        Swal.fire({
          title: 'Proyecto registrado',
          text: 'El proyecto fue agregado correctamente.',
          icon: 'success',
          allowOutsideClick: false,
          allowEscapeKey: false,
          confirmButtonColor: '#004C77'
        });
        // Registrar en auditoría
        const usuarioActual = this.authService.getUserFromToken();
        this.auditoriaService.registrarAuditoria({
          usuario: usuarioActual?.id,
          accion: 'CREACION',
          proyectoId: res.id, // ← ID del proyecto creado
          descripcion: `Registro de nuevo proyecto: ${res.nombre}`
        }).subscribe({
          next: () => console.log('[AUDITORÍA] Registro de proyecto auditado'),
          error: (err) => console.error('[AUDITORÍA] Error al registrar auditoría de proyecto', err)
        });
        this.dialogRef.close(true);
      },
      error: () => {
        Swal.fire({
          title: 'Error',
          text: 'Hubo un error al registrar el proyecto.',
          icon: 'error',
          allowOutsideClick: false,
          allowEscapeKey: false,
          confirmButtonColor: '#F36C21'
        });
      }
    });
  }
}