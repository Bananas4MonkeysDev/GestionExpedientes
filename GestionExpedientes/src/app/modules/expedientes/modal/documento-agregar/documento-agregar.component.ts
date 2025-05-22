import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-documento-agregar',
  standalone: true,
  templateUrl: './documento-agregar.component.html',
  styleUrl: './documento-agregar.component.css',
  imports: [ReactiveFormsModule, CommonModule]
})
export class DocumentoAgregarComponent {
  formulario: FormGroup;
  flujos = ['Flujo A', 'Flujo B', 'Flujo C'];
  areas = ['Contabilidad', 'Logística', 'Gerencia', 'Calidad', 'TI'];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DocumentoAgregarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.formulario = this.fb.group({
      nombre: ['', Validators.required],
      archivo: [null, Validators.required],
      flujo: ['', Validators.required],
      areas: [[], Validators.required],
      confidencial: [false]
    });
  }
  ngOnInit(): void {
    if (this.data) {
      this.formulario.patchValue(this.data);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.formulario.patchValue({ archivo: file });
    }
  }

  guardar() {
    if (this.formulario.valid) {
      this.dialogRef.close(this.formulario.value);
    } else {
      this.formulario.markAllAsTouched();
    }
  }

  cerrar() {
    this.dialogRef.close();
  }
}
