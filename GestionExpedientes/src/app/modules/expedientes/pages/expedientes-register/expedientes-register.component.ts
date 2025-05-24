import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { DocumentoAgregarComponent } from '../../modal/documento-agregar/documento-agregar.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

interface DocumentoExpediente {
  nombre: string;
  archivo: File;
  flujo: string;
  areas: string[];
  cargado: boolean;
  progreso?: number;
  visibleParaExternos?: boolean;
  tipoDocumento?: string;
}
interface Usuario {
  tipo: 'Persona' | 'Grupo' | 'Entidad';
  nombre: string;
  correo: string;
}

@Component({
  selector: 'app-expedientes-register',
  templateUrl: './expedientes-register.component.html',
  styleUrls: ['./expedientes-register.component.css'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    NgxMatSelectSearchModule,
    MatTooltipModule,
    MatIcon
  ]
})
export class ExpedientesRegisterComponent implements OnInit {
  pasoActual: number = 1;
  tipoExpediente: 'interno' | 'externo' | null = null;

  controlReferencia = new FormControl<string[]>([], Validators.required);
  searchCtrlReferencia = new FormControl('');
  todasReferencias: { tipo: 'Carta' | 'Documento' | 'Expediente'; serie: string }[] = [
    { tipo: 'Carta', serie: 'CARTA-001' },
    { tipo: 'Documento', serie: 'DOC-2024-A' },
    { tipo: 'Expediente', serie: 'EXP-7845' },
  ];
  referenciasFiltradas: { tipo: 'Carta' | 'Documento' | 'Expediente'; serie: string }[] = [];

  tiposReferencia: Array<'Carta' | 'Documento' | 'Expediente'> = ['Carta', 'Documento', 'Expediente'];


  formularioPaso1!: FormGroup;
  formularioDocumento!: FormGroup;
  arrastrando = false;
  correoEmisor: string = '';

  documentos: DocumentoExpediente[] = [];
  exito: boolean = false;
  archivoSeleccionado: File | null = null;
  proyectos = ['Proyecto Alpha', 'Obra Central', 'Planta Nueva', 'Infraestructura Zonal'];

  flujos: string[] = ['Aprobación Gerente', 'Firma Legal', 'Revisión Técnica'];
  areasDisponibles: string[] = ['Recursos Humanos', 'Logística', 'Contabilidad', 'TI', 'Gerencia'];

  controlUsuario = new FormControl<string[]>([], Validators.required);
  controlUsuarioCc = new FormControl<string[]>([], Validators.required);
  searchCtrlUsuario = new FormControl('');
  searchCtrlCc = new FormControl('');

  todosUsuarios: Usuario[] = [
    { tipo: 'Persona', nombre: 'Juan Pérez', correo: 'juan.perez@example.com' },
    { tipo: 'Persona', nombre: 'Ana Torres', correo: 'ana.torres@example.com' },
    { tipo: 'Grupo', nombre: 'Contabilidad', correo: 'contabilidad@empresa.com' },
    { tipo: 'Grupo', nombre: 'TI', correo: 'ti@empresa.com' },
    { tipo: 'Entidad', nombre: 'SUNAT', correo: 'contacto@sunat.gob.pe' }
  ];
  tiposDocumento: string[] = ['Informe', 'Carta', 'Anexo'];


  usuariosFiltradosTo: Usuario[] = [];
  usuariosFiltradosCc: Usuario[] = [];

  tiposUsuario: Array<'Persona' | 'Grupo' | 'Entidad'> = ['Persona', 'Grupo', 'Entidad'];

  constructor(private fb: FormBuilder, private dialog: MatDialog) { }

  ngOnInit() {
    this.formularioPaso1 = this.fb.group({
      asunto: ['', Validators.required],
      referencia: this.controlReferencia,
      fecha: ['', Validators.required],
      comentario: [''],
      usuarioDestino: this.controlUsuario,
      usuarioDestinoCc: this.controlUsuarioCc,
      proyecto: ['', Validators.required],
      reservado: [''],
      tipoDocumentoEntrada: ['', Validators.required]
    });

    this.formularioDocumento = this.fb.group({
      detalle3: [''],
      tipoDocumento: ['', Validators.required]
    });

    this.usuariosFiltradosTo = this.todosUsuarios;
    this.usuariosFiltradosCc = this.todosUsuarios;

    this.searchCtrlUsuario.valueChanges.subscribe(search => {
      this.usuariosFiltradosTo = this.filtrarUsuarios(search || '');
    });

    this.searchCtrlCc.valueChanges.subscribe(search => {
      this.usuariosFiltradosCc = this.filtrarUsuarios(search || '');
    });
    this.referenciasFiltradas = this.todasReferencias;

    this.searchCtrlReferencia.valueChanges.subscribe(valor => {
      this.referenciasFiltradas = this.filtrarReferencias(valor || '');
    });
  }
  filtrarReferencias(valor: string) {
    const filtro = valor.toLowerCase();
    return this.todasReferencias.filter(r => r.serie.toLowerCase().includes(filtro));
  }

  obtenerReferenciasPorTipo(tipo: 'Carta' | 'Documento' | 'Expediente') {
    return this.referenciasFiltradas.filter(r => r.tipo === tipo);
  }

  abrirDialogoAgregarReferencia(serie: string) {
    const dialogRef = this.dialog.open(DocumentoAgregarComponent, {
      width: '520px',
      data: {
        modo: 'referencia',
        serie
      }
    });

    dialogRef.afterClosed().subscribe((nuevaReferencia: { tipo: 'Carta' | 'Documento' | 'Expediente'; serie: string }) => {
      if (nuevaReferencia) {
        this.todasReferencias.push(nuevaReferencia);
        this.controlReferencia.setValue([...(this.controlReferencia.value || []), nuevaReferencia.serie]);
        this.referenciasFiltradas = this.filtrarReferencias(this.searchCtrlReferencia.value || '');
      }
    });
  }
  filtrarUsuarios(valor: string): Usuario[] {
    const filtro = valor.toLowerCase();
    return this.todosUsuarios.filter(u => u.nombre.toLowerCase().includes(filtro));
  }

  obtenerUsuariosPorTipo(usuarios: Usuario[], tipo: 'Persona' | 'Grupo' | 'Entidad'): Usuario[] {
    return usuarios.filter(u => u.tipo === tipo);
  }

  abrirDialogoAgregarUsuario(nombre: string, destino: 'to' | 'cc') {
    const dialogRef = this.dialog.open(DocumentoAgregarComponent, {
      width: '520px',
      data: {
        modo: 'usuario',
        nombre,
        destino
      }
    });

    dialogRef.afterClosed().subscribe((nuevoUsuario: Usuario) => {
      if (nuevoUsuario) {
        this.todosUsuarios.push(nuevoUsuario);

        if (destino === 'to') {
          this.controlUsuario.setValue([
            ...(this.controlUsuario.value || []),
            nuevoUsuario.nombre
          ]);
          this.usuariosFiltradosTo = this.filtrarUsuarios(this.searchCtrlUsuario.value || '');
        } else {
          this.controlUsuarioCc.setValue([
            ...(this.controlUsuarioCc.value || []),
            nuevoUsuario.nombre
          ]);
          this.usuariosFiltradosCc = this.filtrarUsuarios(this.searchCtrlCc.value || '');
        }
      }
    });
  }

  seleccionarTipo(tipo: 'interno' | 'externo') {
    this.tipoExpediente = tipo;
    this.pasoActual = 2;

    // Establecer la fecha actual del sistema (hora local de Perú)
    const fechaPeru = new Date();
    const offset = fechaPeru.getTimezoneOffset() * 60000;
    const horaLocalISO = new Date(fechaPeru.getTime() - offset).toISOString().slice(0, 10);

    this.formularioPaso1.patchValue({
      fecha: horaLocalISO
    });
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
    event.preventDefault();
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
  alternarVisibilidad(index: number) {
    this.documentos[index].visibleParaExternos = !this.documentos[index].visibleParaExternos;
  }
  todosLosDocumentosTienenTipo(): boolean {
    return this.documentos.every(doc => doc.tipoDocumento && doc.tipoDocumento.trim() !== '');
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
          progreso: 0,
          visibleParaExternos: false,
          tipoDocumento: ''
        };
        this.documentos.push(doc);

        const sizeKB = archivo.size / 1024;
        const totalTime = Math.min(4000, sizeKB * 10);
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
      this.formularioDocumento.reset();
    } else {
      this.formularioDocumento.markAllAsTouched();
    }
  }

  onSubmit() {
    if (this.documentos.length === 0 || !this.todosLosDocumentosTienenTipo()) return;

    const expediente = {
      tipo: this.tipoExpediente,
      datos: this.formularioPaso1.value,
      documentos: this.documentos
    };

    console.log('Expediente registrado:', expediente);

    this.exito = true;
    this.pasoActual = 3;
    this.formularioPaso1.reset();
    this.formularioDocumento.reset();
    this.documentos = [];
    this.tipoExpediente = null;
    const nombreEmisor = this.formularioPaso1.get('usuarioDestino')?.value?.[0] || '';
    const usuario = this.todosUsuarios.find(u => u.nombre === nombreEmisor);
    this.correoEmisor = usuario?.correo || 'usuario@example.com';

    setTimeout(() => {
      this.pasoActual = 4;
    }, 1200);
    // opcional, para dejar ver el mensaje verde antes
  }
  irAlInicio() {
    // puedes usar Router.navigate si ya tienes rutas
    window.location.href = '/'; // o redireccionar a tu componente inicio
  }

  visualizarExpediente() {
    // esto debe redirigir al componente de lista de expedientes cuando lo crees
    window.location.href = '/expedientes'; // ajustar según tu routing real
  }

  onScanUpload(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    const archivo = fileInput.files?.[0];
    if (!archivo) return;

    // Simulación de extracción de datos desde el PDF
    const datosSimulados = {
      usuario: 'Juan Pérez',
      correo: 'juan.perez@example.com',
      asunto: 'Solicitud de apoyo técnico',
      fecha: new Date().toISOString().slice(0, 10)
    };

    // Verifica si el usuario ya está en la lista
    const yaExiste = this.todosUsuarios.some(
      u => u.nombre === datosSimulados.usuario
    );

    if (!yaExiste) {
      const nuevo: Usuario = {
        tipo: 'Persona',
        nombre: datosSimulados.usuario,
        correo: datosSimulados.correo
      };
      this.todosUsuarios.push(nuevo);
      this.usuariosFiltradosTo = this.todosUsuarios;
    }

    // Setear usuario emisor
    this.controlUsuario.setValue([datosSimulados.usuario]);
    this.controlUsuarioCc.setValue([datosSimulados.usuario]);
    // Asunto
    this.formularioPaso1.patchValue({
      asunto: datosSimulados.asunto,
      fecha: datosSimulados.fecha
    });

    // Feedback en consola
    console.log('Simulación de escaneo exitosa:', datosSimulados);

    // Reset file input para permitir re-subida del mismo archivo si se desea
    fileInput.value = '';
  }

  scanCarta() {
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (fileInput) fileInput.click();
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
    this.pasoActual = 3;
  }
}
