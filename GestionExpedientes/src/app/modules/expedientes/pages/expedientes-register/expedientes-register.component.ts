import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { DocumentoAgregarComponent } from '../../modal/documento-agregar/documento-agregar.component';

interface DocumentoExpediente {
  nombre: string;
  archivo: File;
  flujo: string;
  areas: string[];
  cargado: boolean;
  progreso?: number;
}

@Component({
  selector: 'app-expedientes-register',
  templateUrl: './expedientes-register.component.html',
  styleUrls: ['./expedientes-register.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatDialogModule]
})
export class ExpedientesRegisterComponent {

  pasoActual: number = 1;
  tipoExpediente: 'interno' | 'externo' | null = null;

  formularioPaso1!: FormGroup;
  formularioDocumento!: FormGroup;
  arrastrando = false;

  documentos: DocumentoExpediente[] = [];
  exito: boolean = false;
  archivoSeleccionado: File | null = null;
  proyectos = ['Proyecto Alpha', 'Obra Central', 'Planta Nueva', 'Infraestructura Zonal'];

  flujos: string[] = ['Aprobación Gerente', 'Firma Legal', 'Revisión Técnica'];
  areasDisponibles: string[] = ['Recursos Humanos', 'Logística', 'Contabilidad', 'TI', 'Gerencia'];

  constructor(private fb: FormBuilder) {
    // Paso 2: Formulario de expediente
    this.formularioPaso1 = this.fb.group({
      asunto: ['', Validators.required],
      referencia: ['', Validators.required],
      fecha: ['', Validators.required],
      comentario: [''],
      usuarioDestino: ['', Validators.required],
      usuarioDestinoCc: ['', Validators.required],
      proyecto: ['', Validators.required],
      reservado: ['']
    });

    // Paso 3: Formulario de documento
    this.formularioDocumento = this.fb.group({
      nombre: ['', Validators.required]
    });
  }

  seleccionarTipo(tipo: 'interno' | 'externo') {
    this.tipoExpediente = tipo;
    this.pasoActual = 2;
  }

  siguientePaso() {
    if (this.formularioPaso1.valid) {
      this.pasoActual = 3;
    } else {
      this.formularioPaso1.markAllAsTouched();
    }
  }

  regresarPaso() {
    if (this.pasoActual > 1) {
      this.pasoActual--;
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Importante: permite el drop
    this.arrastrando = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.arrastrando = false;
  }

  onMultipleFilesSelected(event: any) {
    this.cargarArchivos(Array.from(event.target.files));
    event.target.value = '';
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.arrastrando = false;
    if (event.dataTransfer?.files) {
      this.cargarArchivos(Array.from(event.dataTransfer.files));
    }
  }
  private cargarArchivos(files: File[] | FileList) {
    for (let i = 0; i < files.length; i++) {
      const archivo = files[i];
      if (archivo && archivo.type === 'application/pdf') {
        const doc: DocumentoExpediente = {
          nombre: archivo.name,
          archivo: archivo,
          flujo: '',
          areas: [],
          cargado: false,
          progreso: 0
        };
        this.documentos.push(doc);

        // Carga proporcional al tamaño
        const sizeKB = archivo.size / 1024;
        const totalTime = Math.min(4000, sizeKB * 10); // 10ms por KB
        const steps = 20;
        const intervalTime = totalTime / steps;
        let progreso = 0;

        const interval = setInterval(() => {
          progreso += 100 / steps;
          doc.progreso = Math.min(100, Math.round(progreso));

          if (progreso >= 100) {
            doc.cargado = true;
            clearInterval(interval);
          }
        }, intervalTime);
      }
    }
  }

  eliminarDocumento(index: number) {
    this.documentos.splice(index, 1);
  }

  verDocumento(index: number) {
    const archivo = this.documentos[index].archivo;
    const url = URL.createObjectURL(archivo);
    window.open(url, '_blank');
  }

  omitirCargaDocumentos() {
    this.enviarExpediente(true);
  }

  guardarDocumento() {
    if (this.formularioDocumento.valid) {
      const doc: DocumentoExpediente = { ...this.formularioDocumento.value };
      this.documentos.push(doc);
      this.formularioDocumento.reset();  // limpia el formulario
    } else {
      this.formularioDocumento.markAllAsTouched();
    }
  }

  onSubmit() {
    if (this.documentos.length === 0) return;
    this.enviarExpediente(false);
    const expediente = {
      tipo: this.tipoExpediente,
      datos: this.formularioPaso1.value,
      documentos: this.documentos
    };

    console.log('✅ Expediente registrado:', expediente);

    this.exito = true;
    this.pasoActual = 3;
    this.formularioPaso1.reset();
    this.formularioDocumento.reset();
    this.documentos = [];
    this.tipoExpediente = null;

    setTimeout(() => this.exito = false, 5000); // oculta el mensaje luego de 5s
  }

  private enviarExpediente(omitido: boolean) {
    console.log('Expediente registrado:', {
      tipo: this.tipoExpediente,
      datos: this.formularioPaso1.value,
      documentos: omitido ? 'Sin documentos' : this.documentos
    });

    this.exito = true;
    this.formularioPaso1.reset();
    this.documentos = [];
    this.pasoActual = 3; // Se mantiene en el paso final
  }
}
