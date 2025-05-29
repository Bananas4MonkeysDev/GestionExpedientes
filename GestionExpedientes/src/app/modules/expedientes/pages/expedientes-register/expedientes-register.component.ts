import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DocumentoAgregarComponent } from '../../modal/documento-agregar/documento-agregar.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { ExpedienteService } from '../../../../core/services/expediente.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { ReferenciaService, Referencia } from '../../../../core/services/referencia.service';

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
export interface Usuario {
  id: number; // ← Agregado
  nombre: string;
  correo: string;
  contraseña: string;
  rol: string;
  tipoUsuario: 'ADMIN' | 'INTERNO' | 'EXTERNO';
  tipoIdentidad: 'PERSONA' | 'ENTIDAD' | 'GRUPO';
  ruc?: string;
  dni: string;
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
  cargo?: File;
  fechaCargo: string = '';
  arrastrandoCargo = false;
  horaCargo: string = '';
  expedienteIdRegistrado?: number;
  pasoActual = 1;
  tipoExpediente: 'Emisor' | 'Receptor' | null = null;
  correoEmisor = '';

  formularioPaso1!: FormGroup;
  formularioDocumento!: FormGroup;

  proyectos = ['Proyecto Alpha', 'Obra Central', 'Planta Nueva', 'Infraestructura Zonal'];
  tiposDocumento = ['Anexos', 'Actas', 'Carta', 'Oficio', 'Contrato', 'Adenda', 'Solicitud de compra', 'Cotizaciones', 'Cuadro Comparativo', 'Orden de Compra', 'Guia', 'Factura', 'Informe', 'Anexo'];

  tiposUsuario: Usuario['tipoIdentidad'][] = ['PERSONA', 'GRUPO', 'ENTIDAD'];
  tiposReferencia: Referencia['tipo'][] = ['Documento', 'Expediente'];
  referenciasOriginales: Referencia[] = [];

  todosUsuarios: Usuario[] = [];

  todasReferencias: Referencia[] = [];

  controlUsuario = new FormControl<string[]>([], Validators.required);
  controlUsuarioCc = new FormControl<string[]>([], Validators.required);
  controlReferencia = new FormControl<string[]>([], Validators.required);

  searchCtrlUsuario = new FormControl('');
  searchCtrlCc = new FormControl('');
  searchCtrlReferencia = new FormControl('');

  filtroTipoUsuarioTo = '';
  filtroTipoUsuarioCc = '';
  filtroTipoReferencia = '';

  usuariosFiltradosTo: Usuario[] = [];
  usuariosFiltradosCc: Usuario[] = [];
  referenciasFiltradas: Referencia[] = [];

  documentos: DocumentoExpediente[] = [];
  exito = false;
  arrastrando = false;
  seccionActiva: 'registro' | 'estado' | 'auditoria' = 'registro';

  constructor(private fb: FormBuilder, private dialog: MatDialog, private router: Router, private expedienteService: ExpedienteService, private usuarioService: UsuarioService, private referenciaService: ReferenciaService) { }

  ngOnInit(): void {
    this.formularioPaso1 = this.fb.group({
      asunto: ['', Validators.required],
      referencia: this.controlReferencia,
      fecha: ['', Validators.required],
      comentario: [''],
      usuarioDestino: this.controlUsuario,
      usuarioDestinoCc: this.controlUsuarioCc,
      proyecto: ['', Validators.required],
      reservado: ['']
    });
    this.usuarioService.obtenerUsuarios().subscribe({
      next: usuarios => {
        console.log('[DEBUG] Usuarios obtenidos del backend:', usuarios);
        this.todosUsuarios = usuarios.map(user => ({
          ...user,
          tipo: user.tipoIdentidad.charAt(0).toUpperCase() + user.tipoIdentidad.slice(1).toLowerCase()
        }));
        this.usuariosFiltradosTo = [...this.todosUsuarios];
        this.usuariosFiltradosCc = [...this.todosUsuarios];
      },
      error: err => {
        console.error('[ERROR] Error al cargar usuarios:', err);
      }
    });

    this.formularioDocumento = this.fb.group({
      detalle3: [''],
      tipoDocumento: ['', Validators.required]
    });
    this.inicializarFechaYHoraCargo();
    this.referenciaService.obtenerReferencias().subscribe({
      next: (refs: Referencia[]) => {
        this.referenciasOriginales = refs;
        this.referenciasFiltradas = refs;
      },
      error: (err) => {
        console.error('[ERROR] Cargando referencias', err);
      }
    });



    this.usuariosFiltradosTo = this.todosUsuarios;
    this.usuariosFiltradosCc = this.todosUsuarios;

    this.searchCtrlUsuario.valueChanges.subscribe(() => this.filtrarUsuariosTo());
    this.searchCtrlCc.valueChanges.subscribe(() => this.filtrarUsuariosCc());
    this.searchCtrlReferencia.valueChanges.subscribe(() => this.filtrarReferencias());
  }
  inicializarFechaYHoraCargo() {
    const ahora = new Date();

    // Formato YYYY-MM-DD
    this.fechaCargo = ahora.toISOString().split('T')[0];

    // Formato HH:MM (con ceros a la izquierda si es necesario)
    const horas = ahora.getHours().toString().padStart(2, '0');
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    this.horaCargo = `${horas}:${minutos}`;
  }
  // Filtros por tipo y texto
  filtrarUsuariosTo(): void {
    const texto = this.searchCtrlUsuario.value?.toLowerCase() || '';
    this.usuariosFiltradosTo = this.todosUsuarios.filter(u =>
      (!this.filtroTipoUsuarioTo || u.tipoIdentidad === this.filtroTipoUsuarioTo) &&
      (u.nombre.toLowerCase().includes(texto) || u.correo.toLowerCase().includes(texto))
    );
  }

  filtrarUsuariosCc(): void {
    const texto = this.searchCtrlCc.value?.toLowerCase() || '';
    this.usuariosFiltradosCc = this.todosUsuarios.filter(u =>
      (!this.filtroTipoUsuarioCc || u.tipoIdentidad === this.filtroTipoUsuarioCc) &&
      (u.nombre.toLowerCase().includes(texto) || u.correo.toLowerCase().includes(texto))
    );
  }
  filtrarReferencias(): void {
    const texto = this.searchCtrlReferencia.value?.toLowerCase().trim() || '';
    const seleccionadasSeries = (this.controlReferencia.value || []).filter((v): v is string => v !== null && v !== undefined);

    console.log('[DEBUG] Texto de búsqueda:', texto);
    console.log('[DEBUG] Referencias seleccionadas (series):', seleccionadasSeries);

    const filtradas = this.referenciasOriginales.filter(ref => {
      const coincideTipo = !this.filtroTipoReferencia || ref.tipo === this.filtroTipoReferencia;
      const serie = ref.serie?.toLowerCase() || '';
      const asunto = ref.asunto?.toLowerCase() || '';
      const coincideTexto = serie.includes(texto) || asunto.includes(texto);
      return coincideTipo && coincideTexto;
    });

    this.referenciasFiltradas = filtradas;
    console.log('[RESULTADO] referenciasFiltradas:', this.referenciasFiltradas);
  }




  // Helpers visuales
  mostrarGrupo(tipo: string): boolean {
    return true;
  }

  obtenerUsuariosPorTipo(lista: Usuario[], tipo: Usuario['tipoIdentidad']): Usuario[] {
    return lista.filter(u => u.tipoIdentidad === tipo);
  }
  obtenerReferenciasPorTipo(tipo: Referencia['tipo']): Referencia[] {
    return this.referenciasFiltradas.filter(r => r.tipo === tipo);
  }



  // Diálogos
  abrirDialogoAgregarUsuario(nombre: string, destino: 'to' | 'cc') {
    const dialogRef = this.dialog.open(DocumentoAgregarComponent, {
      width: '800px',  // o incluso '90vw' si quieres algo más flexible
      maxWidth: '95vw',
      height: '585px',
      maxHeight: '90vh',
      data: { modo: 'usuario', nombre, destino }
    });

    dialogRef.afterClosed().subscribe((nuevoUsuario: Usuario) => {
      if (!nuevoUsuario) return;
      this.todosUsuarios.push(nuevoUsuario);
      const targetControl = destino === 'to' ? this.controlUsuario : this.controlUsuarioCc;
      targetControl.setValue([...(targetControl.value || []), nuevoUsuario.nombre]);
      destino === 'to' ? this.filtrarUsuariosTo() : this.filtrarUsuariosCc();
    });
  }

  abrirDialogoAgregarReferencia(serie: string) {
    const dialogRef = this.dialog.open(DocumentoAgregarComponent, {
      width: '720px',
      data: { modo: 'referencia', serie }
    });

    dialogRef.afterClosed().subscribe((nuevaReferencia: Referencia) => {
      if (!nuevaReferencia) return;
      this.todasReferencias.push(nuevaReferencia);
      this.controlReferencia.setValue([...(this.controlReferencia.value || []), nuevaReferencia.serie]);
      this.filtrarReferencias();
    });
  }

  // Reset filtros
  reiniciarFiltroTipoTo() {
    this.filtroTipoUsuarioTo = '';
    this.filtrarUsuariosTo();
  }

  reiniciarFiltroTipoCc() {
    this.filtroTipoUsuarioCc = '';
    this.filtrarUsuariosCc();
  }

  reiniciarFiltroTipoReferencia() {
    this.filtroTipoReferencia = '';
    this.filtrarReferencias();
  }

  // Flujo de pasos
  seleccionarTipo(tipo: 'Emisor' | 'Receptor') {
    this.tipoExpediente = tipo;
    this.pasoActual = 2;
    const hoy = new Date();
    const offset = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - offset).toISOString().slice(0, 10);
    this.formularioPaso1.patchValue({ fecha: fechaLocal });
  }

  siguientePaso() {
    if (this.formularioPaso1.valid) {
      this.pasoActual++;

      // Detectar si se ha llegado al paso 4 y establecer hora/fecha actual
      if (this.pasoActual === 4) {
        this.inicializarFechaYHoraCargo();
      }
    } else {
      this.formularioPaso1.markAllAsTouched();
    }
  }

  regresarPaso() {
    if (this.pasoActual > 1) this.pasoActual--;
  }

  // Documentos
  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.arrastrando = true;
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    this.arrastrando = false;
  }

  onFileDrop(e: DragEvent) {
    e.preventDefault();
    this.arrastrando = false;
    if (e.dataTransfer?.files) this.cargarArchivos(Array.from(e.dataTransfer.files));
  }

  onMultipleFilesSelected(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files) this.cargarArchivos(Array.from(files));
  }

  cargarArchivos(files: File[]) {
    for (const archivo of files) {
      if (archivo.type !== 'application/pdf') continue;
      const nuevo: DocumentoExpediente = {
        nombre: archivo.name,
        archivo,
        flujo: '',
        areas: [],
        cargado: false,
        progreso: 0,
        visibleParaExternos: false,
        tipoDocumento: ''
      };
      this.documentos.push(nuevo);
      const interval = setInterval(() => {
        if (nuevo.progreso! >= 100) {
          nuevo.cargado = true;
          clearInterval(interval);
        } else {
          nuevo.progreso! += 10;
        }
      }, 100);
    }
  }

  eliminarDocumento(index: number) {
    this.documentos.splice(index, 1);
  }

  verDocumento(index: number) {
    const url = URL.createObjectURL(this.documentos[index].archivo);
    window.open(url, '_blank');
  }

  alternarVisibilidad(index: number) {
    this.documentos[index].visibleParaExternos = !this.documentos[index].visibleParaExternos;
  }

  todosLosDocumentosTienenTipo(): boolean {
    return this.documentos.every(d => d.tipoDocumento && d.tipoDocumento.trim() !== '');
  }

  onSubmit() {
    if (this.documentos.length === 0 || !this.todosLosDocumentosTienenTipo()) return;

    const expedienteData = {
      tipoExpediente: this.tipoExpediente, // del paso 1
      asunto: this.formularioPaso1.value.asunto,
      proyecto: this.formularioPaso1.value.proyecto,
      fecha: this.formularioPaso1.value.fecha,
      comentario: this.formularioPaso1.value.comentario || '',
      reservado: this.formularioPaso1.value.reservado === 'si',
      usuariosEmisores: this.obtenerIdsPorNombres(this.controlUsuario.value ?? []),
      usuariosDestinatarios: this.obtenerIdsPorNombres(this.controlUsuarioCc.value ?? []),
      referencias: this.controlReferencia.value?.join('|'), // ya son strings

      documentos: [] // no incluir aún, se enviarán luego
    };

    this.expedienteService.registrarExpediente(expedienteData).subscribe({
      next: (expediente) => {
        const expedienteId = expediente.id;
        this.expedienteIdRegistrado = expediente.id;
        const uploads = this.documentos.map(doc => {
          const formData = new FormData();
          formData.append('file', doc.archivo);
          formData.append('nombreArchivo', doc.nombre);
          formData.append('tipoDocumento', doc.tipoDocumento || '');
          formData.append('visibleParaExternos', String(doc.visibleParaExternos ?? false));
          formData.append('tamaño', doc.archivo.size.toString());

          return this.expedienteService.registrarDocumento(expedienteId, formData); // ← clave
        });


        // enviar todos los documentos
        Promise.all(uploads.map(u => u.toPromise())).then(() => {
          Swal.fire({
            title: 'Expediente registrado',
            text: 'Los documentos fueron cargados exitosamente.',
            icon: 'success',
            confirmButtonColor: '#004C77'
          }).then(() => {
            this.pasoActual = 4;
            this.exito = true;
          });
        });
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo registrar el expediente.',
          icon: 'error'
        });
      }
    });
  }

  obtenerIdsPorNombres(nombresSeleccionados: string[]): string {
    const ids = this.todosUsuarios
      .filter(user => nombresSeleccionados.includes(user.nombre))
      .map(user => user.id.toString());
    return ids.join('|');
  }


  omitirCargaDocumentos() {
    const expedienteData = {
      tipoExpediente: this.tipoExpediente,
      asunto: this.formularioPaso1.value.asunto,
      proyecto: this.formularioPaso1.value.proyecto,
      fecha: this.formularioPaso1.value.fecha,
      comentario: this.formularioPaso1.value.comentario || '',
      reservado: this.formularioPaso1.value.reservado === 'si',
      usuariosEmisores: this.obtenerIdsPorNombres(this.controlUsuario.value ?? []),
      usuariosDestinatarios: this.obtenerIdsPorNombres(this.controlUsuarioCc.value ?? []),
      referencias: this.controlReferencia.value?.join('|'),
      documentos: [] // explícitamente vacío
    };

    this.expedienteService.registrarExpediente(expedienteData).subscribe({
      next: () => {
        Swal.fire({
          title: 'Expediente registrado',
          text: 'Aun no se cargo ningun documento',
          icon: 'success',
          confirmButtonColor: '#004C77'
        }).then(() => {
          this.pasoActual = 4;
          this.exito = true;
        });
        this.pasoActual = 4;
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo registrar el expediente sin documentos.',
          icon: 'error',
          confirmButtonColor: '#004C77'
        });
      }

    });
  }

  irAlInicio() {
    window.location.href = '/';
  }

  visualizarExpediente() {
    window.location.href = '/expedientes';
  }

  formatearPeso(bytes: number): string {
    return bytes >= 1024 * 1024
      ? (bytes / (1024 * 1024)).toFixed(1) + ' MB'
      : (bytes / 1024).toFixed(0) + ' KB';
  }

  onScanUpload(event: Event) {
  /*  const archivo = (event.target as HTMLInputElement).files?.[0];
    if (!archivo) return;
    const simulado = {
      usuario: 'Juan Pérez',
      correo: 'juan.perez@example.com',
      asunto: 'Solicitud de apoyo técnico',
      fecha: new Date().toISOString().slice(0, 10)
    };
    if (!this.todosUsuarios.some(u => u.nombre === simulado.usuario)) {
      this.todosUsuarios.push({ tipoIdentidad: 'PERSONA', nombre: simulado.usuario, correo: simulado.correo });
      this.filtrarUsuariosTo();
    }
    this.controlUsuario.setValue([simulado.usuario]);
    this.controlUsuarioCc.setValue([simulado.usuario]);
    this.formularioPaso1.patchValue({ asunto: simulado.asunto, fecha: simulado.fecha });
  */}

  scanCarta() {
    document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  }
  onCargoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.type === 'application/pdf') {
      this.cargo = file;
    }
  }

  onFileDropCargo(event: DragEvent) {
    event.preventDefault();
    this.arrastrandoCargo = false;
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type === 'application/pdf') {
      this.cargo = file;
    }
  }

  enviarCargo() {
    if (!this.fechaCargo) {
      Swal.fire({
        title: 'Fecha requerida',
        text: 'Debe seleccionar la fecha del cargo.',
        icon: 'warning',
        confirmButtonColor: '#004C77'
      });
      return;
    }

    if (!this.horaCargo) {
      Swal.fire({
        title: 'Hora requerida',
        text: 'Debe seleccionar la hora del cargo.',
        icon: 'warning',
        confirmButtonColor: '#004C77'
      });
      return;
    }

    // Aquí debes usar el ID real del expediente creado
    const expedienteId = this.expedienteIdRegistrado || 0; // reemplaza por el ID correcto desde tu flujo

    const formData = new FormData();
    formData.append('fecha', this.fechaCargo);
    formData.append('hora', this.horaCargo);
    formData.append('expedienteId', expedienteId.toString());

    if (this.cargo) {
      formData.append('archivo', this.cargo, this.cargo.name);
    }

    this.expedienteService.registrarCargo(formData).subscribe({
      next: () => {
        Swal.fire({
          title: 'Cargo registrado',
          text: this.cargo
            ? 'El documento de cargo fue enviado con la fecha seleccionada.'
            : 'Se notificó la fecha del cargo. No se adjuntó documento.',
          icon: 'success',
          confirmButtonColor: '#004C77'
        }).then(() => {
          this.router.navigate(['/detalle-expediente']);
        });
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo registrar el cargo.',
          icon: 'error',
          confirmButtonColor: '#004C77'
        });
        console.error(err);
      }
    });
  }


}
