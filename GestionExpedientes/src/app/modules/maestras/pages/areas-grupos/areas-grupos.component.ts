import { Component } from '@angular/core';
import { GrupoArea, GrupoAreaService } from '../../../../core/services/grupo-area.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-areas-grupos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatTooltipModule,],
  templateUrl: './areas-grupos.component.html',
  styleUrl: './areas-grupos.component.css'
})
export class AreasGruposComponent {
  grupos: GrupoArea[] = [];
  usuarios: any[] = [];
  Math = Math;

  grupoActual: GrupoArea = {
    nombre: '',
    descripcion: '',
    tipo: '',
    usuariosIds: ''
  };

  usuariosSeleccionados: string[] = [];
  modo: 'crear' | 'editar' = 'crear';

  paginaActual = 1;
  elementosPorPagina = 5;

  constructor(
    private grupoAreaService: GrupoAreaService,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit(): void {
    this.cargarGrupos();
    this.cargarUsuarios();
  }

  cargarGrupos(): void {
    this.grupoAreaService.listar().subscribe(data => this.grupos = data);
  }

  cargarUsuarios(): void {
    this.usuarioService.obtenerUsuarios().subscribe(data => this.usuarios = data);
  }
  get totalPaginas(): number {
    return Math.ceil(this.grupos.length / this.elementosPorPagina);
  }

  irPaginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  irPaginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }
  cancelarEdicion(): void {
    this.resetFormulario();
  }

  guardar(): void {
    // Validación
    if (!this.grupoActual.nombre || !this.grupoActual.tipo || this.usuariosSeleccionados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos obligatorios',
        allowOutsideClick: false,
        allowEscapeKey: false,
        text: 'Completa nombre, tipo y selecciona al menos un usuario.'
      });
      return;
    }

    this.grupoActual.usuariosIds = this.usuariosSeleccionados.join('|');

    if (this.modo === 'crear') {
      this.grupoAreaService.crear(this.grupoActual).subscribe(() => {
        Swal.fire('¡Registrado!', 'Grupo o área registrado correctamente.', 'success');
        this.resetFormulario();
        this.cargarGrupos();
      });
    } else {
      this.grupoAreaService.actualizar(this.grupoActual.id!, this.grupoActual).subscribe(() => {
        Swal.fire('¡Actualizado!', 'Registro actualizado correctamente.', 'success');
        this.resetFormulario();
        this.cargarGrupos();
      });
    }
  }

  editar(grupo: GrupoArea): void {
    this.grupoActual = { ...grupo };
    this.usuariosSeleccionados = grupo.usuariosIds?.split('|') ?? [];
    this.modo = 'editar';
  }

  eliminar(id: number): void {
    Swal.fire({
      title: '¿Eliminar este grupo o área?',
      text: 'No podrás deshacer esta acción.',
      icon: 'warning',
      showCancelButton: true,
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.grupoAreaService.eliminar(id).subscribe(() => {
          Swal.fire('Eliminado', 'El grupo o área ha sido eliminado.', 'success');
          this.cargarGrupos();
        });
      }
    });
  }

  resetFormulario(): void {
    this.grupoActual = { nombre: '', descripcion: '', tipo: '', usuariosIds: '' };
    this.usuariosSeleccionados = [];
    this.modo = 'crear';
  }
}
