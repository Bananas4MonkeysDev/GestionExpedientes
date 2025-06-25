import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  formularioLogin: FormGroup;
  cargando = false;
  errorLogin = false;
  verPassword = false;

  constructor(private authService: AuthService, private route: ActivatedRoute, private fb: FormBuilder, private router: Router, private usuarioService: UsuarioService
  ) {
    this.formularioLogin = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', Validators.required]
    });
    if (this.authService.tieneSesionActiva()) {
      const redirect = this.route.snapshot.queryParamMap.get('redirect');
      const expedienteId = this.route.snapshot.queryParamMap.get('id');

      if (redirect) {
        this.router.navigate([`${redirect}`], {
          queryParams: expedienteId ? { id: expedienteId } : {}
        });
      } else {
        this.router.navigate(['home']);
      }
    }

  }

  onSubmit() {
    if (this.formularioLogin.valid) {
      this.cargando = true;
      this.errorLogin = false;

      const { usuario, password } = this.formularioLogin.value;

      const loginData = {
        correo: usuario,
        contraseña: password
      };

      this.usuarioService.login(loginData).subscribe({
        next: (response) => {
          const token = response.token;
          localStorage.setItem('jwt', token);

          // Lee los parámetros de redirección
          const redirect = this.route.snapshot.queryParamMap.get('redirect');
          const expedienteId = this.route.snapshot.queryParamMap.get('id');

          if (redirect) {
            this.router.navigate([`${redirect}`], {
              queryParams: expedienteId ? { id: expedienteId } : {}
            });
          } else {
            this.router.navigate(['home']);
          }
        },
        error: (err) => {
          console.error('Error en login:', err);
          this.errorLogin = true;
          this.cargando = false;
        }
      });
    } else {
      this.formularioLogin.markAllAsTouched();
    }
  }
}
