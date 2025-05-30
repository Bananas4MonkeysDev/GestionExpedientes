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

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DocumentoAgregarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DatosDialogo,
    private usuarioService: UsuarioService
  ) {
    this.modo = data.modo;
    this.form = this.fb.group(
      data.modo === 'usuario'
        ? {
          nombre: ['', Validators.required],
          correo: [
            '',
            [Validators.required, Validators.email],
            [this.usuarioService.validarCorreoAsync(this.usuarioService)] // Asignamos el validador asincrónico para el correo
          ], contraseña: ['', Validators.required],
          dni: [
            '',
            [Validators.required, Validators.pattern('^[0-9]{8}$'), Validators.minLength(8), Validators.maxLength(8)],
            [this.usuarioService.validarDniAsync(this.usuarioService)] // Asignamos el validador asincrónico para el DNI
          ], rol: ['', Validators.required],
          ruc: [''],
          tipoIdentidad: ['', Validators.required],
          tipoUsuario: ['', Validators.required]
        }
        : {
          serie: [data.serie || '', Validators.required],
          tipo: ['Carta', Validators.required]
        }
    );


  }

  cancelar() {
    this.dialogRef.close();
  }

   guardar() {
    if (this.form.valid && this.modo === 'usuario') {
      const nuevoUsuario = this.form.value;
      console.log('[DEBUG] Usuario a registrar:', nuevoUsuario);
      this.usuarioService.registrarUsuario(nuevoUsuario).subscribe({
        next: (res) => {
          console.log('[DEBUG] Usuario registrado con éxito:', res);
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('[ERROR] Error al registrar usuario:', err);
        }
      });
    }
  }

}
