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
import { LoadingOverlayService } from '../../../../core/services/loading-overlay.service';
import { ReferenciaAgregarComponent } from '../../modal/referencia-agregar/referencia-agregar.component';
import { MatChipsModule } from '@angular/material/chips';
import { ProyectoService } from '../../../../core/services/proyecto.service';
import { Proyecto } from '../../../../core/models/proyecto.model';
import { ProyectoAgregarComponent } from '../../modal/proyecto-agregar/proyecto-agregar.component';
import { AuthService } from '../../../../core/services/auth.service';
import { AuditoriaService } from '../../../../core/services/auditoria.service';

interface ReferenciaCompleta {
  serie: string;
  asunto: string;
  tipo: 'Documento' | 'Expediente' | 'MANUAL';
}

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
    MatChipsModule,
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
  isLoading = false;

  formularioPaso1!: FormGroup;
  formularioDocumento!: FormGroup;

  proyectos: Proyecto[] = [];
  tiposDocumento = ['Anexos', 'Actas', 'Carta', 'Oficio', 'Contrato', 'Adenda', 'Solicitud de compra', 'Cotizaciones', 'Cuadro Comparativo', 'Orden de Compra', 'Guia', 'Factura', 'Informe', 'Anexo'];

  tiposUsuario: Usuario['tipoIdentidad'][] = ['PERSONA', 'GRUPO', 'ENTIDAD'];
  tiposReferencia: Referencia['tipo'][] = ['Documento', 'Expediente'];
  referenciasOriginales: Referencia[] = [];

  todosUsuarios: Usuario[] = [];

  todasReferencias: Referencia[] = [];

  controlUsuario = new FormControl<string[]>([], Validators.required);
  controlUsuarioCc = new FormControl<string[]>([], Validators.required);
  controlReferencia = new FormControl<ReferenciaCompleta[]>([], Validators.required);

  searchCtrlUsuario = new FormControl('');
  searchCtrlCc = new FormControl('');
  searchCtrlReferencia = new FormControl('');

  filtroTipoUsuarioTo = '';
  filtroTipoUsuarioCc = '';
  filtroTipoReferencia = '';

  usuariosFiltradosTo: Usuario[] = [];
  usuariosFiltradosCc: Usuario[] = [];
  referenciasFiltradas: Referencia[] = [];
  compararReferencias = (a: any, b: any): boolean => {
    return a?.serie === b?.serie;
  };

  documentos: DocumentoExpediente[] = [];
  exito = false;
  arrastrando = false;
  seccionActiva: 'registro' | 'estado' | 'auditoria' = 'registro';

  constructor(private auditoriaService: AuditoriaService
    , private authService: AuthService, private proyectoService: ProyectoService, private loadingService: LoadingOverlayService, private fb: FormBuilder, private dialog: MatDialog, private router: Router, private expedienteService: ExpedienteService, private usuarioService: UsuarioService, private referenciaService: ReferenciaService) { }

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
    this.setReferenciaValidator(false);  // Inicialmente, las referencias no son obligatorias

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
    this.proyectoService.getAll().subscribe(data => {
      this.proyectos = data;
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
  abrirDialogoProyecto(): void {
    const dialogRef = this.dialog.open(ProyectoAgregarComponent, {
      width: '1000px' // o incluso '90vw' si quieres algo más flexible
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.proyectoService.getAll().subscribe(data => {
          this.proyectos = data;
        });
      }
    });
  }
  setReferenciaValidator(isRequired: boolean): void {
    if (isRequired) {
      this.controlReferencia.setValidators([Validators.required]);
    } else {
      this.controlReferencia.clearValidators();
    }
    this.controlReferencia.updateValueAndValidity();
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
  removerReferencia(ref: ReferenciaCompleta): void {
    const actuales = this.controlReferencia.value ?? [];
    this.controlReferencia.setValue(actuales.filter(r => r.serie !== ref.serie));
  }


  removerUsuarioCc(nombre: string): void {
    const actuales = this.controlUsuarioCc.value ?? [];
    this.controlUsuarioCc.setValue(actuales.filter(n => n !== nombre));
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
    const seleccionadas: ReferenciaCompleta[] = this.controlReferencia.value || [];

    const filtradas = this.referenciasOriginales.filter(ref => {
      const coincideTipo = !this.filtroTipoReferencia || ref.tipo === this.filtroTipoReferencia;
      const coincideTexto =
        ref.serie?.toLowerCase().includes(texto) || ref.asunto?.toLowerCase().includes(texto);
      return coincideTipo && coincideTexto;
    });

    this.referenciasFiltradas = filtradas;
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

  desenfocarYabrir(element: HTMLElement, valor: string, destino: 'to' | 'cc') {
    element.blur(); // Remueve el foco
    this.abrirDialogoAgregarUsuario(valor, destino);
  }

  // Diálogos
  abrirDialogoAgregarUsuario(nombre: string, destino: 'to' | 'cc') {
    setTimeout(() => {
      const dialogRef = this.dialog.open(DocumentoAgregarComponent, {
        width: '800px',  // o incluso '90vw' si quieres algo más flexible
        maxWidth: '95vw',
        height: '585px',
        maxHeight: '90vh',
        data: { modo: 'usuario', nombre, destino }
      });

      dialogRef.afterClosed().subscribe(() => {
        console.log('[DEBUG] El diálogo de agregar usuario se cerró, recargando la lista de usuarios...');
        this.cargarUsuarios();  // Recargamos la lista de usuarios
      });
    }, 0);
  }


  cargarUsuarios(): void {
    console.log('[DEBUG] Cargando usuarios...');
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        console.log('[DEBUG] Usuarios obtenidos del backend:', usuarios);

        // Actualizar todos los usuarios
        this.todosUsuarios = usuarios.map(user => ({
          ...user,
          tipo: user.tipoIdentidad.charAt(0).toUpperCase() + user.tipoIdentidad.slice(1).toLowerCase()
        }));

        // Actualizar las listas de los selects filtrados
        this.usuariosFiltradosTo = [...this.todosUsuarios];
        this.usuariosFiltradosCc = [...this.todosUsuarios];

        // También actualizamos los valores seleccionados en los controles
        this.controlUsuario.setValue(this.controlUsuario.value || []);
        this.controlUsuarioCc.setValue(this.controlUsuarioCc.value || []);

        // Reaplicar los filtros
        this.filtrarUsuariosTo();
        this.filtrarUsuariosCc();

        console.log('[DEBUG] Usuarios filtrados para "to":', this.usuariosFiltradosTo);
        console.log('[DEBUG] Usuarios filtrados para "cc":', this.usuariosFiltradosCc);
      },
      error: (err) => {
        console.error('[ERROR] Error al cargar usuarios:', err);
      }
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
  agregarReferenciaManual(event: Event): void {
    event.preventDefault();

    const teclado = event as KeyboardEvent;

    const valor = this.searchCtrlReferencia.value?.trim();
    if (!valor) return;

    const actuales: ReferenciaCompleta[] = this.controlReferencia.value || [];

    const yaExiste = actuales.some(ref => ref.serie === valor);
    if (yaExiste) return;

    const nueva: ReferenciaCompleta = {
      serie: valor,
      asunto: '(Referencia manual)',
      tipo: 'MANUAL'
    };

    this.controlReferencia.setValue([...actuales, nueva]);
    this.searchCtrlReferencia.setValue('', { emitEvent: false });
  }
  removerUsuario(nombre: string): void {
    const actuales = this.controlUsuario.value || [];
    this.controlUsuario.setValue(actuales.filter(u => u !== nombre));
  }

  abrirDialogoAgregarReferencia() {
    const dialogRef = this.dialog.open(ReferenciaAgregarComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((result: string[] | null) => {
      if (!result || !result.length) return;

      const actuales: ReferenciaCompleta[] = this.controlReferencia.value || [];

      result.forEach(valor => {
        const yaExiste = actuales.some(ref => ref.serie === valor);
        if (!yaExiste) {
          actuales.push({
            serie: valor,
            asunto: '(Referencia manual)',
            tipo: 'MANUAL'
          });
        }
      });

      this.controlReferencia.setValue([...actuales]);
    });
  }

  referenciasLibresSeleccionadas(): ReferenciaCompleta[] {
    const seleccionadas = this.controlReferencia.value || [];
    const conocidas = this.referenciasOriginales.map(r => r.serie);
    return seleccionadas.filter(r => !conocidas.includes(r.serie));
  }


  onSubmit() {
    if (this.documentos.length === 0 || !this.todosLosDocumentosTienenTipo()) return;
    const usuarioActual = this.authService.getUserFromToken();
    console.log('[DEBUG] Usuario actual extraído del token:', usuarioActual);

    const expedienteData = {
      tipoExpediente: this.tipoExpediente, // del paso 1
      asunto: this.formularioPaso1.value.asunto,
      proyecto: this.formularioPaso1.value.proyecto,
      fecha: this.formularioPaso1.value.fecha,
      comentario: this.formularioPaso1.value.comentario || '',
      reservado: this.formularioPaso1.value.reservado === 'si',
      usuariosEmisores: this.obtenerIdsPorNombres(this.controlUsuario.value ?? []),
      usuariosDestinatarios: this.obtenerIdsPorNombres(this.controlUsuarioCc.value ?? []),
      referencias: this.obtenerReferenciasFinales(),
      creadoPor: usuarioActual?.id,
      documentos: [] // no incluir aún, se enviarán luego
    };

    this.expedienteService.registrarExpediente(expedienteData).subscribe({
      next: (expediente) => {
        this.auditoriaService.registrarAuditoria({
          usuario: usuarioActual?.id,
          accion: 'CREACION',
          expedienteId: expediente.id,
          descripcion: 'Registro de nuevo expediente con documentos'
        }).subscribe({
          next: () => console.log('[AUDITORIA] Registrada'),
          error: err => console.error('[AUDITORIA] Error al registrar', err)
        });
        const expedienteId = expediente.id;
        this.expedienteIdRegistrado = expediente.id;
        console.log(this.expedienteIdRegistrado);
        const uploads = this.documentos.map(doc => {
          const formData = new FormData();
          formData.append('file', doc.archivo);
          formData.append('nombreArchivo', doc.nombre);
          formData.append('tipoDocumento', doc.tipoDocumento || '');
          formData.append('visibleParaExternos', String(doc.visibleParaExternos ?? false));
          formData.append('tamaño', doc.archivo.size.toString());

          return this.expedienteService.registrarDocumento(expedienteId, formData); // ← clave
        });

        this.loadingService.show();

        // enviar todos los documentos
        Promise.all(uploads.map(u => u.toPromise())).then((respuestas) => {
          // respuestas contiene cada documento registrado
          respuestas.forEach((documentoRegistrado, index) => {
            this.auditoriaService.registrarAuditoria({
              usuario: usuarioActual?.id,
              accion: 'CREACION',
              expedienteId: this.expedienteIdRegistrado,
              documentoId: documentoRegistrado.id,
              descripcion: `Registro de documento: ${documentoRegistrado.nombreArchivo}`
            }).subscribe({
              next: () => console.log(`[AUDITORIA] Documento ${index + 1} registrado`),
              error: err => console.error('[AUDITORIA] Error al registrar auditoría de documento', err)
            });
          });

          // Luego de auditar todos, notificar expediente
          this.expedienteService.notificarExpediente(this.expedienteIdRegistrado!).subscribe({
            next: () => {
              this.loadingService.hide();
              Swal.fire({
                title: 'Expediente registrado',
                text: 'Los documentos fueron cargados exitosamente.',
                icon: 'success',
                confirmButtonColor: '#004C77'
              }).then(() => {
                this.pasoActual = 4;
                this.exito = true;
              });
              console.log('[✔] Notificación enviada correctamente');
            },
            error: (err) => {
              this.loadingService.hide();
              console.error('[✖] Error al enviar notificación:', err);
            }
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
  obtenerReferenciasFinales(): string | null {
    const referencias: ReferenciaCompleta[] = this.controlReferencia.value || [];
    if (!referencias.length) return null;

    return referencias.map(ref => ref.serie).join('|');
  }

  obtenerIdsPorNombres(nombresSeleccionados: string[]): string {
    const ids = this.todosUsuarios
      .filter(user => nombresSeleccionados.includes(user.nombre))
      .map(user => {
        // Aseguramos que user.id esté definido antes de intentar convertirlo
        if (user.id !== undefined && user.id !== null) {
          return user.id.toString();
        } else {
          console.warn(`Usuario sin ID encontrado: ${user.nombre}`);
          return ''; // Retorna un string vacío si no tiene id
        }
      })
      .filter(id => id !== ''); // Filtramos los ids vacíos

    return ids.join('|');
  }



  omitirCargaDocumentos() {
    const usuarioActual = this.authService.getUserFromToken();
    console.log('[DEBUG] Usuario actual extraído del token:', usuarioActual);

    const expedienteData = {
      tipoExpediente: this.tipoExpediente,
      asunto: this.formularioPaso1.value.asunto,
      proyecto: this.formularioPaso1.value.proyecto,
      fecha: this.formularioPaso1.value.fecha,
      comentario: this.formularioPaso1.value.comentario || '',
      reservado: this.formularioPaso1.value.reservado === 'si',
      usuariosEmisores: this.obtenerIdsPorNombres(this.controlUsuario.value ?? []),
      usuariosDestinatarios: this.obtenerIdsPorNombres(this.controlUsuarioCc.value ?? []),
      referencias: this.obtenerReferenciasFinales(),
      creadoPor: usuarioActual?.id,
      documentos: [] // explícitamente vacío
    };
    this.loadingService.show();
    this.expedienteService.registrarExpediente(expedienteData).subscribe({
      next: (expediente) => {
        this.auditoriaService.registrarAuditoria({
          usuario: usuarioActual?.id,
          accion: 'CREACION',
          expedienteId: expediente.id,
          descripcion: 'Registro de nuevo expediente sin documentos'
        }).subscribe({
          next: () => console.log('[AUDITORIA] Registrada'),
          error: err => console.error('[AUDITORIA] Error al registrar', err)
        });
        this.expedienteIdRegistrado = expediente.id;
        console.log(this.expedienteIdRegistrado);
        this.expedienteService.notificarExpediente(this.expedienteIdRegistrado!).subscribe({
          next: () => {
            this.loadingService.hide();
            Swal.fire({
              title: 'Expediente registrado',
              text: 'Aun no se cargo ningun documento',
              icon: 'success',
              confirmButtonColor: '#004C77'
            }).then(() => {
              this.pasoActual = 4;
              this.exito = true;
            });
            console.log('[✔] Notificación enviada sin documentos');
          },
          error: (err) => {
            this.loadingService.hide();
            console.error('[✖] Error en notificación sin documentos:', err);
          }
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
  get referenciasCompletas(): ReferenciaCompleta[] {
    const actuales: ReferenciaCompleta[] = this.controlReferencia.value ?? [];
    const conocidas = this.referenciasOriginales.map(ref => ref.serie);

    const libres: ReferenciaCompleta[] = actuales.filter(ref =>
      !conocidas.includes(ref.serie) && ref.tipo === 'MANUAL'
    );

    return [...this.referenciasFiltradas, ...libres];
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
    this.loadingService.show();
    console.log(this.expedienteIdRegistrado);

    // Aquí debes usar el ID real del expediente creado
    const expedienteId = this.expedienteIdRegistrado || 0; // reemplaza por el ID correcto desde tu flujo
    const usuario = this.authService.getUserFromToken();

    const formData = new FormData();
    formData.append('fecha', this.fechaCargo);
    formData.append('hora', this.horaCargo);
    formData.append('expedienteId', expedienteId.toString());
    if (usuario?.id != null) {
      formData.append('usuarioCreadorId', usuario.id.toString());
    } else {
      console.warn('Usuario no disponible o no tiene ID');
    } if (this.cargo) {
      formData.append('archivo', this.cargo, this.cargo.name);
    }

    this.expedienteService.registrarCargo(formData).subscribe({
      next: (cargo) => {
        this.loadingService.hide();
        this.auditoriaService.registrarAuditoria({
          usuario: usuario?.id,
          accion: 'CREACION',
          expedienteId: expedienteId,
          cargoId: cargo.id, // ← asumimos que el backend retorna el cargo creado con ID
          descripcion: 'Registro de nuevo cargo' + (this.cargo ? ' con documento' : ' sin documento')
        }).subscribe({
          next: () => console.log('[AUDITORIA] Cargo registrado'),
          error: err => console.error('[AUDITORIA] Error al registrar auditoría de cargo', err)
        });
        Swal.fire({
          title: 'Cargo registrado',
          text: this.cargo
            ? 'El documento de cargo fue enviado con éxito.'
            : 'Se registró el cargo sin documento.',
          icon: 'success',
          confirmButtonColor: '#004C77',
          timer: 2000,
          showConfirmButton: true
        });

        this.router.navigate(['/detalle-expediente', this.expedienteIdRegistrado]);
        this.expedienteIdRegistrado = undefined;
      }
      ,
      error: (err) => {
        this.loadingService.hide();
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
  confirmarOmitirCargo() {
    if (!this.expedienteIdRegistrado) {
      console.error('No hay ID de expediente para mostrar detalle');
      return;
    }
    Swal.fire({
      title: '¿Omitir el cargo?',
      text: 'Podrás registrar el cargo más adelante desde la vista de detalle del expediente.',
      icon: 'warning',
      showCancelButton: false,
      confirmButtonText: 'OK',
      confirmButtonColor: '#F36C21'
    }).then(() => {
      console.log(this.expedienteIdRegistrado);

      this.router.navigate(['/detalle-expediente', this.expedienteIdRegistrado]).then(() => {
        this.expedienteIdRegistrado = undefined;  // Limpiar variable después de navegar
      });
    });
  }

}
