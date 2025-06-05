import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-dialogo-cargo',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dialogo-cargo.component.html',
  styleUrls: ['./dialogo-cargo.component.css']
})
export class DialogoCargoComponent {
  fechaCargo: string = '';
  horaCargo: string = '';
  cargo: File | null = null;
  arrastrandoCargo = false;
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<DialogoCargoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data?.cargo) {
      this.fechaCargo = data.cargo.fecha || '';
      this.horaCargo = data.cargo.hora || '';
      // No puedes prellenar el archivo directamente, pero puedes mostrar su nombre si quieres
    }
  }
  ngOnInit(): void {
    const ahora = new Date();

    // Si viene un cargo para editar
    if (this.data?.cargoExistente) {
      this.fechaCargo = this.data.cargoExistente.fecha || this.formatearFecha(ahora);
      this.horaCargo = this.data.cargoExistente.hora || this.formatearHora(ahora);
      this.cargo = this.data.cargoExistente.archivo || null;
    } else {
      // Nuevo cargo: inicializa con fecha y hora actuales
      this.fechaCargo = this.formatearFecha(ahora);
      this.horaCargo = this.formatearHora(ahora);
    }
  }
  formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatearHora(fecha: Date): string {
    const hours = String(fecha.getHours()).padStart(2, '0');
    const minutes = String(fecha.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  onCargoSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.cargo = file;
    }
  }
  cerrar() {
    this.dialogRef.close();
  }
  onFileDropCargo(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.type === 'application/pdf') {
      this.cargo = file;
    }
    this.arrastrandoCargo = false;
  }

  enviarCargo(): void {
    if (!this.fechaCargo || !this.horaCargo) {
      alert('Fecha y hora son obligatorias.');
      return;
    }
    this.isLoading = true;

    const nuevoCargo = {
      fecha: this.fechaCargo,
      hora: this.horaCargo,
      archivo: this.cargo
    };

    this.dialogRef.close(nuevoCargo);
  }

}
