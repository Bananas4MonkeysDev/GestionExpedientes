import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProyectoService } from '../../../../../core/services/proyecto.service';
import { CommonModule } from '@angular/common';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import Swal from 'sweetalert2';

export interface Proyecto {
  id?: number;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
}

@Component({
  selector: 'app-proyecto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatSelectModule
  ],
  templateUrl: './proyecto.component.html',
  styleUrl: './proyecto.component.css'
})
export class ProyectoComponent implements OnInit {
  form: FormGroup;
  proyectos = new MatTableDataSource<Proyecto>();
  columnas = ['id', 'nombre', 'descripcion', 'fechaInicio', 'fechaFin', 'acciones'];
  modo: 'crear' | 'editar' = 'crear';
  proyectoActualId: number | null = null;

  constructor(private fb: FormBuilder, private service: ProyectoService) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      fechaInicio: ['', Validators.required],
      fechaFin: ['']
    });
  }

  ngOnInit(): void {
    this.listar();
  }

  listar(): void {
    this.service.getAll().subscribe(data => {
      this.proyectos.data = data;
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    const proyecto: Proyecto = this.form.value;

    if (this.modo === 'crear') {
      this.service.create(proyecto).subscribe({
        next: () => {
          this.form.reset();
          this.listar();
          Swal.fire('¡Registrado!', 'El proyecto ha sido creado.', 'success');
        },
        error: () => {
          Swal.fire('Error', 'No se pudo registrar el proyecto.', 'error');
        }
      });
    } else if (this.proyectoActualId !== null) {
      this.service.update(this.proyectoActualId, proyecto).subscribe({
        next: () => {
          this.form.reset();
          this.modo = 'crear';
          this.proyectoActualId = null;
          this.listar();
          Swal.fire('¡Actualizado!', 'El proyecto ha sido actualizado.', 'success');
        },
        error: () => {
          Swal.fire('Error', 'No se pudo actualizar el proyecto.', 'error');
        }
      });
    }
  }

  editar(p: Proyecto): void {
    this.form.patchValue(p);
    this.modo = 'editar';
    this.proyectoActualId = p.id!;
  }

  eliminar(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#004C77',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    }).then(result => {
      if (result.isConfirmed) {
        this.service.delete(id).subscribe({
          next: () => {
            this.listar();
            Swal.fire('¡Eliminado!', 'El proyecto ha sido eliminado.', 'success');
          },
          error: () => {
            Swal.fire('Error', 'No se pudo eliminar el proyecto.', 'error');
          }
        });
      }
    });
  }
}
