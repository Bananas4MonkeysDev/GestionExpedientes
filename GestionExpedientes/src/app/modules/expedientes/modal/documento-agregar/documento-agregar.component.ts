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

type ModoDialogo = 'usuario' | 'referencia';

interface DatosUsuario {
  modo: 'usuario';
  nombre: string;
  destino: 'to' | 'cc';
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

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DocumentoAgregarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DatosDialogo,
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {
    this.modo = data.modo;
    const user = this.authService.getUserFromToken();
    this.tipoUsuarioActual = user?.tipoUsuario || '';

    this.form = this.fb.group(
      data.modo === 'usuario'
        ? {
          nombre: ['', Validators.required],
          correo: [
            '',
            [Validators.required, Validators.email],
            [this.usuarioService.validarCorreoAsync(usuarioService)]
          ],
          contraseña: ['', Validators.required],
          dni: ['', [Validators.pattern('^[0-9]{8}$'), Validators.minLength(8), Validators.maxLength(8)]],
          ruc: [''],
          rol: ['', Validators.required],
          tipoIdentidad: ['', Validators.required],
          tipoUsuario: ['', Validators.required]
        }
        : {
          serie: [data.serie || '', Validators.required],
          tipo: ['Carta', Validators.required]
        }
    );

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

      Swal.fire({
        title: 'Registrando usuario...',
        text: 'Por favor, espera un momento',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.usuarioService.registrarUsuario(nuevoUsuario).subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: 'Usuario registrado',
            text: 'El usuario fue registrado correctamente.',
            confirmButtonColor: '#004C77'
          });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('[ERROR] Error al registrar usuario:', err);

          const mensajeError = err?.error?.mensaje || 'Ocurrió un error inesperado al registrar el usuario.';

          Swal.fire({
            icon: 'error',
            title: 'Error al registrar',
            text: mensajeError,
            confirmButtonColor: '#F36C21'
          });
        }
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor, completa todos los campos obligatorios antes de continuar.',
        confirmButtonColor: '#F36C21'
      });
    }
  }


}
