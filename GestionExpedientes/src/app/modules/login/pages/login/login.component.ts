import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

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

  constructor(private fb: FormBuilder, private router: Router) {
    this.formularioLogin = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.formularioLogin.valid) {
      this.cargando = true;
      this.errorLogin = false;

      const { usuario, password } = this.formularioLogin.value;

      setTimeout(() => {
        if (usuario === 'admin' && password === 'admin') {
          this.router.navigate(['/home']);
        } else {
          this.errorLogin = true;
        }
        this.cargando = false;
      }, 1000);
    } else {
      this.formularioLogin.markAllAsTouched();
    }
  }
}
