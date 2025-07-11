import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { UsuarioService, Usuario } from '../../../../core/services/usuario.service';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../core/services/auth.service';
import { AuditoriaService } from '../../../../core/services/auditoria.service';
import { GrupoArea, GrupoAreaService } from '../../../../core/services/grupo-area.service';

type ModoDialogo = 'usuario' | 'referencia';

interface DatosUsuario {
  modo: 'usuario';
  nombre: string;
  destino?: 'to' | 'cc';
  usuario?: Usuario;
}

interface DatosReferencia {
  modo: 'referencia';
  serie: string;
}

type DatosDialogo = DatosUsuario | DatosReferencia;
@Component({
  selector: 'app-documento-agregar',
  templateUrl: './documento-agregar.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule, MatIcon
  ]
})

export class DocumentoAgregarComponent {
  form: FormGroup;
  modo: ModoDialogo;
  tipoUsuarioActual: string = '';
  grupoAreaTipoSeleccionado: string = '';
  opcionesGrupoArea: GrupoArea[] = [];
  todasLasOpcionesGrupoArea: GrupoArea[] = [];
  constructor(
    private auditoriaService: AuditoriaService,
    private grupoAreaService: GrupoAreaService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DocumentoAgregarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DatosDialogo,
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {
    this.modo = data.modo;
    const user = this.authService.getUserFromToken();
    this.tipoUsuarioActual = user?.tipoUsuario || '';
    const usuarioEditando: Usuario | undefined = (data as any).usuario;

    this.grupoAreaService.listar().subscribe((todos) => {
      this.todasLasOpcionesGrupoArea = todos;
    });
    this.form = this.fb.group(
      this.modo === 'usuario'
        ? {
          nombre: [usuarioEditando?.nombre || (data as DatosUsuario).nombre || '', Validators.required],
          correo: [usuarioEditando?.correo ||
            '',
          [Validators.required, Validators.email],
          [this.usuarioService.validarCorreoAsync(usuarioService)]
          ],
          contraseña: [usuarioEditando ? '' : '', usuarioEditando ? [] : Validators.required],
          dni: [usuarioEditando?.dni || '', [Validators.pattern('^[0-9]{8}$'), Validators.minLength(8), Validators.maxLength(8)]],
          ruc: [usuarioEditando?.ruc || ''],
          rol: [usuarioEditando?.rol || '', Validators.required],
          tipoIdentidad: [usuarioEditando?.tipoIdentidad || '', Validators.required],
          tipoUsuario: [usuarioEditando?.tipoUsuario || '', Validators.required],
          firmante: [usuarioEditando?.firmante ?? false], // por defecto no firmante
          tipoFirma: [usuarioEditando?.tipoFirma || '']
        }
        : {
        }
    );
    if (usuarioEditando?.id) {
      const idUsuario = usuarioEditando.id.toString();
      this.form.addControl('id', this.fb.control(usuarioEditando.id));
      this.form.get('contraseña')?.disable();
      this.grupoAreaService.listar().subscribe((todos) => {
        this.todasLasOpcionesGrupoArea = todos;
        const grupoDelUsuario = todos.find(grupo =>
          grupo.usuariosIds?.split('|').includes(idUsuario)
        );

        if (grupoDelUsuario) {
          this.form.get('grupoAreaTipo')?.setValue(grupoDelUsuario.tipo);
          this.opcionesGrupoArea = todos.filter(g => g.tipo === grupoDelUsuario.tipo);
          this.form.get('grupoAreaId')?.setValue(grupoDelUsuario.id);
        }
      });
    }


    // reacción al cambio de tipo
    this.form.addControl('grupoAreaTipo', this.fb.control(''));
    this.form.addControl('grupoAreaId', this.fb.control(''));

    this.form.get('grupoAreaTipo')?.valueChanges.subscribe((tipo: string) => {
      this.opcionesGrupoArea = this.todasLasOpcionesGrupoArea.filter(g => g.tipo === tipo);
      this.form.get('grupoAreaId')?.reset();
    });
    this.form.get('firmante')?.valueChanges.subscribe((valor) => {
      if (!valor) {
        this.form.get('tipoFirma')?.reset();
      }
    });

    // Reaccionar a cambios en tipoIdentidad
    this.form.get('tipoIdentidad')?.valueChanges.subscribe((tipo: string) => {
      const dniControl = this.form.get('dni');
      const rucControl = this.form.get('ruc');

      if (tipo === 'ENTIDAD') {
        dniControl?.clearValidators(); // quitar required
        rucControl?.setValidators([
          Validators.required, Validators.pattern('^[0-9]{11}$'), Validators.minLength(11),
          Validators.maxLength(11)]); // activar validaciones
      } else {
        dniControl?.setValidators([
          Validators.required,
          Validators.pattern('^[0-9]{8}$'),
          Validators.minLength(8),
          Validators.maxLength(8)
        ]);
        rucControl?.clearValidators(); // no requerido
      }

      dniControl?.updateValueAndValidity();
      rucControl?.updateValueAndValidity();
    });

  }

  cancelar() {
    this.dialogRef.close();
  }

  guardar() {
    if (this.form.valid && this.modo === 'usuario') {
      const nuevoUsuario = this.form.value;
      const esEdicion = !!this.form.get('id')?.value;
      const usuarioActual = this.authService.getUserFromToken();
      const grupoAreaId = this.form.value.grupoAreaId;
      const request = esEdicion
        ? this.usuarioService.actualizarUsuario(this.form.get('id')!.value, nuevoUsuario)
        : this.usuarioService.registrarUsuario(nuevoUsuario);

      request.subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: esEdicion ? 'Usuario actualizado' : 'Usuario registrado',
            text: esEdicion
              ? 'Los datos del usuario fueron actualizados correctamente.'
              : 'El usuario fue registrado correctamente.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            confirmButtonColor: '#004C77'
          });
          const accion = esEdicion ? 'EDICION' : 'CREACION';

          const usuarioActual = this.authService.getUserFromToken();
          this.auditoriaService.registrarAuditoria({
            usuario: usuarioActual?.id,
            accion,
            usuarioId: res.id, // ← ID del usuario recién creado
            descripcion: `${accion} de usuario: ${res.nombre} (${res.correo})`
          }).subscribe({
            next: () => console.log(`[AUDITORÍA] ${accion} registrada`),
            error: (err) => console.error('[AUDITORÍA] Error al registrar auditoría de usuario', err)
          });
          const grupoAreaId = this.form.value.grupoAreaId;
          if (!esEdicion && grupoAreaId) {
            this.grupoAreaService.obtener(grupoAreaId).subscribe(grupo => {
              const idsActuales = grupo.usuariosIds ? grupo.usuariosIds.split('|') : [];

              // Verifica que no esté ya
              if (!idsActuales.includes(res.id.toString())) {
                idsActuales.push(res.id.toString());
                grupo.usuariosIds = idsActuales.join('|');

                this.grupoAreaService.actualizar(grupoAreaId, grupo).subscribe({
                  next: () => console.log(`Usuario ${res.id} agregado al grupo/área ${grupo.nombre}`),
                  error: (err) => console.error('Error al actualizar grupo/área con nuevo usuario:', err)
                });
              }
            });
          }

          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('[ERROR] Error al registrar usuario:', err);

          const mensajeError = err?.error?.mensaje || 'Ocurrió un error inesperado al registrar el usuario.';

          Swal.fire({
            icon: 'error',
            title: 'Error al registrar',
            allowOutsideClick: false,
            allowEscapeKey: false,
            text: mensajeError,
            confirmButtonColor: '#F36C21'
          });
        }
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        allowOutsideClick: false,
        allowEscapeKey: false,
        text: 'Por favor, completa todos los campos obligatorios antes de continuar.',
        confirmButtonColor: '#F36C21'
      });
    }
  }


}
