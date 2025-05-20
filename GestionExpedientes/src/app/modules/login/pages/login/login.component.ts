import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone:true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
 formularioLogin: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.formularioLogin = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.formularioLogin.valid) {
      const { usuario, password } = this.formularioLogin.value;
      console.log('Enviando login:', usuario, password);
      // Aquí luego conectamos con AuthService
      this.router.navigate(['/dashboard']);
    }
  }
}