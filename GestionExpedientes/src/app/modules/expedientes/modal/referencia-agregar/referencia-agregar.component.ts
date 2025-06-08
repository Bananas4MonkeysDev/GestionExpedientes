import { DialogModule } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-referencia-agregar',
  standalone: true,
  imports: [MatIcon, CommonModule, DialogModule, MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule, ReactiveFormsModule],
  templateUrl: './referencia-agregar.component.html',
  styleUrl: './referencia-agregar.component.css'
})
export class ReferenciaAgregarComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ReferenciaAgregarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      referencias: this.fb.array([this.fb.control('', Validators.required)])
    });
  }

  get referencias(): FormArray {
    return this.form.get('referencias') as FormArray;
  }

  agregarCampo() {
    this.referencias.push(this.fb.control('', Validators.required));
  }

  quitarCampo(i: number) {
    this.referencias.removeAt(i);
  }

  guardar() {
    const valores = this.referencias.value.map((v: string) => v.trim()).filter(Boolean);
    this.dialogRef.close(valores);
  }

  cancelar() {
    this.dialogRef.close(null);
  }
}