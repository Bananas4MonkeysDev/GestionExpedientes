import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-expedientes-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './expedientes-register.component.html',
  styleUrl: './expedientes-register.component.css'
})
export class ExpedientesRegisterComponent {
  formulario: FormGroup;
  archivoPDF: File | null = null;

  flujos = ['Legalización', 'Revisión Contable', 'Aprobación Directiva'];
  areasDisponibles = ['Recursos Humanos', 'Logística', 'Contabilidad', 'TI', 'Gerencia'];

  constructor(private fb: FormBuilder) {
    this.formulario = this.fb.group({
      flujo: ['', Validators.required],
      areas: [[], Validators.required]
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      this.archivoPDF = input.files[0];
      console.log('Archivo seleccionado:', this.archivoPDF.name);
    }
  }

  onSubmit() {
    if (this.formulario.valid && this.archivoPDF) {
      const datos = {
        flujo: this.formulario.value.flujo,
        areas: this.formulario.value.areas,
        archivo: this.archivoPDF
      };
      console.log('Datos a enviar:', datos);
      // Aquí luego se envía al backend con FormData
    } else {
      console.warn('Formulario incompleto o archivo faltante');
    }
  }
}
