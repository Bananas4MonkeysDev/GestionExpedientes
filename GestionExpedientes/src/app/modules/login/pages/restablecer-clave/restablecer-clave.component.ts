import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-restablecer-clave',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './restablecer-clave.component.html',
  styleUrl: './restablecer-clave.component.css'
})
export class RestablecerClaveComponent {
  correo: string = '';
  token: string = '';
  nuevaClave: string = '';
  confirmarClave: string = '';
  mensaje: string = '';
  step: number = 1;
  isLoading: boolean = false;
  constructor(private usuarioService: UsuarioService, private router: Router) { }

  // Paso 1: Enviar correo con el token
  // Paso 1: Enviar correo con el token
  enviarEmail(): void {
    this.isLoading = true;
    this.usuarioService.recuperarClave(this.correo).subscribe({
      next: (response) => {
        // Usamos `response.message` ya que el backend ahora devuelve un JSON
        this.mensaje = response.message;
        this.isLoading = false;
        Swal.fire({
          title: 'Éxito',
          text: this.mensaje,
          icon: 'success',
          confirmButtonText: 'Ok'
        });
        this.step = 2; // Ir al paso 2 para ingresar el token
      },
      error: (err) => {
        // Ahora mostramos el mensaje de error también desde `err.error.message`
        this.mensaje = err.error.message;
        this.isLoading = false;
        Swal.fire({
          title: 'Error',
          text: this.mensaje,
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }


  validarToken(): void {
    this.isLoading = true;
    console.log("Token enviado: " + this.token); // Verifica el token que se está enviando
    this.usuarioService.validarTokenRecuperacion(this.token).subscribe({
      next: (response) => {
        console.log("Respuesta del backend: ", response); // Log de la respuesta
        this.isLoading = false;
        this.mensaje = 'Token válido. Ahora ingresa tu nueva contraseña.';
        Swal.fire({
          title: 'Token Válido',
          text: 'El token es válido, ahora ingresa tu nueva contraseña.',
          icon: 'success',
          confirmButtonText: 'Ok'
        });
        this.step = 3; // Ir al paso 3 para cambiar la contraseña
      },
      error: (err) => {
        console.log("Error al validar token: ", err); // Log de error
        this.isLoading = false;
        this.mensaje = 'El token es inválido o ha expirado.';
        Swal.fire({
          title: 'Error',
          text: 'El token es inválido o ha expirado.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }



  // Paso 3: Restablecer la contraseña
 restablecerClave(): void {
    this.isLoading = true;

    if (this.nuevaClave !== this.confirmarClave) {
        this.mensaje = 'Las contraseñas no coinciden.';
        return;
    }

    this.usuarioService.restablecerClave(this.token, this.nuevaClave).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.mensaje = response.message; // Usamos el mensaje del JSON de la respuesta
        Swal.fire({
          title: 'Contraseña Actualizada',
          text: this.mensaje,
          icon: 'success',
          confirmButtonText: 'Ok'
        });

        setTimeout(() => {
          this.router.navigate(['/login']);  // Redirigir al login
        }, 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.mensaje = err.error.message || 'Error al actualizar la contraseña.';
        Swal.fire({
          title: 'Error',
          text: this.mensaje,
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
}

}