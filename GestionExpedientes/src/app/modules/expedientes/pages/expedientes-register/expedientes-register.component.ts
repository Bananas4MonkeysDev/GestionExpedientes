import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DocumentoAgregarComponent } from '../../modal/documento-agregar/documento-agregar.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
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
import { OcrService } from '../../../../core/services/ocr-service.service';
import { ScanCartaComponent } from '../scan-carta/scan-carta.component';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { GrupoArea, GrupoAreaService } from '../../../../core/services/grupo-area.service';

interface NivelFirma {
  usuarios: string[];
  usuarioSeleccionado?: string;
}

interface ReferenciaCompleta {
  serie: string;
  asunto: string;
  tipo: 'Documento' | 'Expediente' | 'MANUAL';
}
interface DocumentoNuevo {
  id?: any;
  nivelesFirma?: any;
  nombre: string;
  archivo: File;
  cargado?: boolean;
  progreso?: number;
  visibleParaExternos?: boolean;
  tipoDocumento?: string;
  esExistente: false;
}
interface GrupoVisual {
  id: string;
  nombre: string;
  tipoUsuario: 'GRUPO';
  correo: string;
  idsUsuarios: number[];
  tipoIdentidad?: 'GRUPO';
}


type UsuarioVisual = Usuario | GrupoVisual;

interface DocumentoExpediente {
  nombre: string;
  archivo: File;
  flujo: any[];
  areas: string[];
  cargado: boolean;
  progreso?: number;
  visibleParaExternos?: boolean;
  tipoDocumento?: string;
  esExistente?: boolean;
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
interface DocumentoExpedienteExtendido extends DocumentoExpediente {
  requiereFirma?: boolean;
  nivelesFirma?: NivelFirma[];
}

@Component({
  selector: 'app-expedientes-register',
  templateUrl: './expedientes-register.component.html',
  styleUrls: ['./expedientes-register.component.css'],
  standalone: true,
  imports: [
    MatChipsModule,
    ReactiveFormsModule,
    MatButtonToggleModule,
    FormsModule,
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    NgxMatSelectSearchModule,
    MatTooltipModule,
    MatIcon,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
  ]
})
export class ExpedientesRegisterComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  documentosNuevos: DocumentoNuevo[] = [];
  idExpedienteRespondido: number | null = null;
  botonDeshabilitado: boolean = false;
  minDate = new Date();
  rutaLocal: string = '';
  rutaOUrl: string = '';
  cargo?: File;
  fechaCargo: string = '';
  arrastrandoCargo = false;
  horaCargo: string = '';
  expedienteIdRegistrado?: number;
  pasoActual = 1;
  tipoExpediente: 'Emisor' | 'Receptor' | null = null;
  correoEmisor = '';
  isLoading = false;
  documentosExistentes: any[] = [];
  modoFlujoFirma: 'individual' | 'general' = 'individual';
  niveles: { nombre: string, usuarios: any[] }[] = [];
  usuariosInternos: any[] = [];
  expediente: any = null;
  formularioPaso1!: FormGroup;
  formularioDocumento!: FormGroup;
  usuariosInternosFiltrados: Usuario[] = [];
  proyectos: Proyecto[] = [];
  tiposDocumento = ['Anexos', 'Actas', 'Carta', 'Oficio', 'Contrato', 'Adenda', 'Solicitud de compra', 'Cotizaciones', 'Cuadro Comparativo', 'Orden de Compra', 'Guia', 'Factura', 'Informe', 'Anexo'];
  nivelesFirmaGenerales: any[] = [];
  minDateString: string | undefined;
  tiposUsuario: Usuario['tipoIdentidad'][] = ['PERSONA', 'GRUPO', 'ENTIDAD'];
  tiposReferencia: Referencia['tipo'][] = [];
  referenciasOriginales: Referencia[] = [];
  usuariosFiltradosTo: UsuarioVisual[] = [];
  usuariosFiltradosCc: UsuarioVisual[] = [];
  tiposUsuarioFirma: Usuario['tipoUsuario'][] = ['INTERNO', 'EXTERNO', 'ADMIN'];

  todosUsuarios: UsuarioVisual[] = [];

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

  referenciasFiltradas: Referencia[] = [];
  compararReferencias = (a: any, b: any): boolean => {
    return a?.serie === b?.serie;
  };

  documentos: DocumentoExpediente[] = [];
  exito = false;
  arrastrando = false;
  seccionActiva: 'registro' | 'estado' | 'auditoria' = 'registro';

  constructor(private grupoAreaService: GrupoAreaService, private route: ActivatedRoute,
    private ocrService: OcrService, private auditoriaService: AuditoriaService
    , private authService: AuthService, private proyectoService: ProyectoService, private loadingService: LoadingOverlayService, private fb: FormBuilder, private dialog: MatDialog, private router: Router, private expedienteService: ExpedienteService, private usuarioService: UsuarioService, private referenciaService: ReferenciaService) { }

  ngOnInit(): void {
    this.tiposReferencia = this.tipoExpediente === 'Emisor'
      ? ['Expediente']
      : ['Documento', 'Expediente'];
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    this.minDateString = `${yyyy}-${mm}-${dd}`;
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
        console.log("ususarios totales:", usuarios);
        this.usuariosInternos = usuarios.filter(u => u.firmante === true);
        console.log("ususarios internos:", this.usuariosInternos);

        const usuariosTransformados: Usuario[] = usuarios.map(user => ({
          ...user,
          tipoUsuario: user.tipoUsuario?.toUpperCase() || '',
          tipoIdentidad: user.tipoIdentidad?.toUpperCase() || '',
        }));

        this.todosUsuarios = usuariosTransformados;

        this.grupoAreaService.listar().subscribe(grupos => {
          const gruposComoUsuarios: GrupoVisual[] = grupos.map(grupo => ({
            id: `grupo-${grupo.id}`,
            nombre: grupo.nombre,
            tipoUsuario: 'GRUPO',
            correo: 'Grupo de usuarios',
            tipoIdentidad: 'GRUPO',
            idsUsuarios: grupo.usuariosIds.split('|').map(id => parseInt(id, 10))
          }));

          // Mezclar
          this.todosUsuarios = [...this.todosUsuarios, ...gruposComoUsuarios];
          this.usuariosFiltradosTo = [...this.todosUsuarios];
          this.usuariosFiltradosCc = [...this.todosUsuarios];

          // Agrega GRUPO si no existe
          if (!this.tiposUsuario.includes('GRUPO')) {
            this.tiposUsuario.push('GRUPO');
          }
        });
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
        console.log('[DEBUG] Referencias del backend:', refs);

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
    let referenciasAnteriores: ReferenciaCompleta[] = [];
    this.controlReferencia.valueChanges.subscribe((referencias: ReferenciaCompleta[] | null) => {
      if (!referencias || this.tipoExpediente !== 'Emisor') return;
      console.log("Estoy inicializando un emisor.");
      const nuevaReferencia = referencias.find(
        nueva => !referenciasAnteriores.some(ref => ref.serie === nueva.serie)
      );
      referenciasAnteriores = [...referencias]; // actualizar el estado anterior
      if (!nuevaReferencia || nuevaReferencia.tipo !== 'Expediente') return;
      const id = this.obtenerIdExpedienteDesdeSerie(nuevaReferencia.serie);
      if (!id) return;

      Swal.fire({
        title: '¿Desea cargar los datos del expediente referenciado?',
        text: 'Se sobrescribirán campos como asunto, proyecto, usuarios y documentos.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cargar datos',
        cancelButtonText: 'No, solo referenciar',
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonColor: '#004C77',
        cancelButtonColor: '#888'
      }).then(result => {
        if (result.isConfirmed) {
          this.cargarExpedienteDesdeReferencia(id);
        } else {
          console.log('Referencia asignada sin cargar datos cruzados.');
        }
      });
    });


    this.route.queryParams.subscribe(params => {
      const tipoParam = params['tipo'];
      const responderA = params['responderA'];
      this.idExpedienteRespondido = +responderA || null;

      if (tipoParam === 'Emisor') {
        this.tipoExpediente = 'Emisor';
        this.pasoActual = 2;

        // Cargar datos del expediente original para precargar campos
        if (responderA) {
          this.expedienteService.getExpedienteDetalle(+responderA).subscribe({
            next: (data) => {
              this.documentosExistentes = data.documentos.map((doc: any) => ({
                id: doc.id,
                nombreArchivo: doc.nombreArchivo,
                tipoDocumento: doc.tipoDocumento,
                rutaArchivo: doc.rutaArchivo,
                tamaño: doc.tamaño,
                visibleParaExternos: doc.visibleParaExternos,
                esExistente: true,
                requiereFirma: true
              }));

              const exp = data.expediente;

              // Asignar asunto como "Respuesta a ..."
              const nuevoAsunto = `Respuesta a ${exp.asunto}`;

              // Referencias → se selecciona el expediente original como referencia
              const referenciaExpediente: ReferenciaCompleta = {
                serie: exp.codigo,
                asunto: exp.asunto,
                tipo: 'Expediente' // ← tipo válido según tu lógica de referencias
              };

              this.controlReferencia.setValue([referenciaExpediente], { emitEvent: false });
              // Usuario emisor ← los destinatarios del original
              const receptores = data.usuariosDestinatarios.map((u: any) => u.nombre);
              this.controlUsuario.setValue(receptores);
              // Usuario destinatario ← los emisores del original
              const emisores = data.usuariosEmisores.map((u: any) => u.nombre);
              this.controlUsuarioCc.setValue(emisores);
              // Proyecto
              this.formularioPaso1.patchValue({ proyecto: exp.proyecto });
              this.formularioPaso1.patchValue({ reservado: exp.reservado ? 'si' : 'no' })
              // Asunto
              this.formularioPaso1.patchValue({ asunto: nuevoAsunto });
              // Fecha actual
              const hoy = new Date();
              const offset = hoy.getTimezoneOffset() * 60000;
              const fechaLocal = new Date(hoy.getTime() - offset).toISOString().slice(0, 10);
              this.formularioPaso1.patchValue({ fecha: fechaLocal });
              this.actualizarEstadoBotonRegistro();
            },
            error: (err) => {
              console.error('[ERROR] No se pudo cargar expediente original para prellenar', err);
            }
          });
        }
      }
    });
  }
  onCarpetaSeleccionada(event: any): void {
    const archivos: FileList = event.target.files;
    if (!archivos || archivos.length === 0) {
      Swal.fire('Aviso', 'No se encontraron archivos PDF en la carpeta seleccionada.', 'info');
      return;
    }

    const pdfs = Array.from(archivos).filter(
      (file: File) => file.type === 'application/pdf'
    );

    if (pdfs.length === 0) {
      Swal.fire('Aviso', 'No se encontraron archivos PDF.', 'info');
      return;
    }

    // ✅ Reutilizamos tu función de carga manual
    this.cargarArchivosDocumentosNuevos(pdfs);

    Swal.fire('Éxito', `${pdfs.length} documentos PDF cargados correctamente.`, 'success');
  }

  expandirUsuariosSeleccionados(nombresSeleccionados: string[]): number[] {
    const ids: number[] = [];

    for (const nombre of nombresSeleccionados) {
      const usuario = this.todosUsuarios.find(u => u.nombre === nombre);

      if (!usuario) continue;

      if (usuario.tipoUsuario === 'GRUPO' && 'idsUsuarios' in usuario) {
        ids.push(...usuario.idsUsuarios);
      } else if ('id' in usuario && typeof usuario.id === 'number') {
        ids.push(usuario.id);
      }
    }

    return Array.from(new Set(ids)); // elimina duplicados
  }

  obtenerIdExpedienteDesdeSerie(serie: string): number | null {
    const ref = this.referenciasOriginales.find(r => r.serie === serie && r.tipo === 'Expediente');
    return ref?.id ? Number(ref.id) : null;
  }

  filtrarUsuariosInternos(nivel: any) {
    const searchTerm = nivel.searchControl.value?.toLowerCase() || '';
    const tipoFiltro = nivel.filtroTipo;

    nivel.usuariosFiltrados = this.usuariosInternos.filter(u => {
      const coincideNombre = u.nombre.toLowerCase().includes(searchTerm);
      const coincideTipo = !tipoFiltro || u.tipoIdentidad === tipoFiltro;
      return coincideNombre && coincideTipo;
    });
  }
  mostrarGrupoInternoTipo(tipo: string, nivel: { usuariosFiltrados: Usuario[] }): boolean {
    return nivel.usuariosFiltrados.some((u: Usuario) => u.tipoUsuario === tipo);
  }

  agregarNivelGeneral() {
    console.log("usuarios internos:", this.usuariosInternos);
    this.nivelesFirmaGenerales.push({
      controlUsuarios: new FormControl<string[]>([]),
      searchControl: new FormControl(''),
      filtroTipo: '',
      usuariosFiltrados: [...this.usuariosInternos]
    });
  }

  eliminarNivelGeneral(index: number) {
    this.nivelesFirmaGenerales.splice(index, 1);
  }

  removerUsuarioNivelGeneral(usuario: string, nivel: any) {
    nivel.controlUsuarios.setValue(nivel.controlUsuarios.value.filter((u: string) => u !== usuario));
  }
  inicializarNivelesFirma() {
    this.documentosExistentes.forEach(doc => {
      doc.nivelesFirma = []; // ← cada doc tendrá su array de niveles
    });
  }
  actualizarEstadoBotonRegistro(): void {
    this.botonDeshabilitado = !this.validarNivelesFirma();
  }
  agregarNivel(doc: any) {
    console.log("usuarios internos:", this.usuariosInternos);
    const nivel = {
      controlUsuarios: new FormControl([]),
      searchControl: new FormControl(''),
      filtroTipo: '',
      usuariosFiltrados: [...this.usuariosInternos],
      fechaLimite: '',
      modoConexion: 'Y'
    };

    doc.nivelesFirma = doc.nivelesFirma || [];
    doc.nivelesFirma.push(nivel);

    nivel.searchControl.valueChanges.subscribe(() => this.filtrarUsuariosInternos(nivel));
  }

  removerUsuarioNivel(usuario: string, nivel: any) {
    const actual = nivel.controlUsuarios.value as string[];
    nivel.controlUsuarios.setValue(actual.filter(u => u !== usuario));
  }
  mostrarGrupoInterno(tipo: string): boolean {
    return this.usuariosInternosFiltrados.some(user => user.tipoUsuario === tipo);
  }

  reiniciarFiltroInternos(nivel: any) {
    nivel.searchControl.setValue('');
  }

  eliminarNivel(doc: any, index: number) {
    doc.nivelesFirma.splice(index, 1);
  }
  verDocumentoExistente(index: number) {
    const doc = this.documentosExistentes[index];
    if (doc.rutaArchivo) {
      window.open(doc.rutaArchivo, '_blank');
    }
  }
  onMultipleFilesSelectedx(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      console.log('[DEBUG] Archivos seleccionados:', input.files);
      this.cargarArchivosDocumentosNuevos(Array.from(input.files));
    }
  }
  cargarExpedienteDesdeReferencia(id: number) {
    this.expedienteService.getExpedienteDetalle(id).subscribe({
      next: (data) => {
        this.idExpedienteRespondido = id;

        this.documentosExistentes = data.documentos.map((doc: any) => ({
          id: doc.id,
          nombreArchivo: doc.nombreArchivo,
          tipoDocumento: doc.tipoDocumento,
          rutaArchivo: doc.rutaArchivo,
          tamaño: doc.tamaño,
          visibleParaExternos: doc.visibleParaExternos,
          esExistente: true,
          requiereFirma: true
        }));

        const exp = data.expediente;

        this.controlReferencia.setValue([{
          serie: exp.codigo,
          asunto: exp.asunto,
          tipo: 'Expediente'
        }], { emitEvent: false });

        this.controlUsuario.setValue(data.usuariosDestinatarios.map((u: any) => u.nombre));
        this.controlUsuarioCc.setValue(data.usuariosEmisores.map((u: any) => u.nombre));

        this.formularioPaso1.patchValue({
          proyecto: exp.proyecto,
          reservado: exp.reservado ? 'si' : 'no',
          asunto: `Respuesta a ${exp.asunto}`,
          fecha: new Date().toISOString().slice(0, 10)
        });

        this.inicializarNivelesFirma();
        this.actualizarEstadoBotonRegistro();

      },
      error: err => console.error('Error al cargar expediente de referencia', err)
    });
  }

  confirmarCambioTipoDocumento(index: number): void {
    Swal.fire({
      title: '¿Cambiar tipo de documento?',
      text: 'Se actualizará el tipo de este documento.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#004C77',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then(result => {
      if (!result.isConfirmed) {
        // Revertir el cambio si es necesario
        this.documentosExistentes[index].tipoDocumento = '';
      }
    });
  }

  toggleVisibilidadDocumento(index: number): void {
    this.documentosExistentes[index].visibleParaExternos =
      !this.documentosExistentes[index].visibleParaExternos;
  }

  eliminarDocumentoExistente(index: number): void {
    Swal.fire({
      title: '¿Eliminar documento?',
      text: 'Esta acción eliminará el documento del expediente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.documentosExistentes.splice(index, 1);
      }
    });
  }

  subirDocumentosAdicionales(): void {
    // Aquí puedes usar this.documentosNuevos y llamar a tu backend como en onSubmit()
    console.log('Subiendo documentos adicionales...');
    // Ejemplo: recorrer documentos y subir por separado
    for (const doc of this.documentosNuevos) {
      const formData = new FormData();
      formData.append('file', doc.archivo);
      formData.append('nombreArchivo', doc.nombre);
      formData.append('tipoDocumento', doc.tipoDocumento || '');
      formData.append('visibleParaExternos', String(doc.visibleParaExternos ?? false));
      formData.append('tamaño', doc.archivo.size.toString());

      if (!this.expedienteIdRegistrado) {
        console.error('No hay ID de expediente para subir documentos adicionales');
        return;
      }

      this.expedienteService.registrarDocumento(this.expedienteIdRegistrado, formData).subscribe({
        next: (res) => {
          console.log('[✔] Documento adicional subido:', res);
        },
        error: (err) => {
          console.error('[✖] Error al subir documento adicional:', err);
        }
      });
    }

    Swal.fire({
      icon: 'success',
      title: 'Documentos adicionales subidos',
      confirmButtonColor: '#004C77',
      timer: 1500
    });

    this.documentosNuevos = [];
  }

  verDocumentoNuevo(index: number) {
    const doc = this.documentosNuevos[index];
    if (doc.archivo) {
      const url = URL.createObjectURL(doc.archivo);
      window.open(url, '_blank');
    }
  }

  alternarVisibilidadNuevo(index: number) {
    this.documentosNuevos[index].visibleParaExternos = !this.documentosNuevos[index].visibleParaExternos;
  }

  eliminarDocumentoNuevo(index: number) {
    this.documentosNuevos.splice(index, 1);
  }

  todosLosDocumentosNuevosTienenTipo(): boolean {
    return this.documentosNuevos.every(d => d.tipoDocumento && d.tipoDocumento.trim() !== '');
  }
  cargarArchivosDocumentosNuevos(files: File[]) {
    console.log('[DEBUG] Archivos a procesar:', files);
    for (const archivo of files) {
      if (archivo.type !== 'application/pdf') {
        console.warn('[AVISO] Archivo ignorado (no es PDF):', archivo.name);
        continue;
      }

      const nuevo: DocumentoNuevo & {
        nivelesFirma?: any[];
      } = {
        nombre: archivo.name,
        archivo,
        cargado: false,
        progreso: 0,
        visibleParaExternos: false,
        tipoDocumento: '',
        esExistente: false,
        nivelesFirma: []
      };
      this.documentosNuevos.push(nuevo);

      const interval = setInterval(() => {
        if (nuevo.progreso! >= 100) {
          nuevo.cargado = true;
          clearInterval(interval);
        } else {
          nuevo.progreso! += 10;
        }
      }, 100);
      this.actualizarEstadoBotonRegistro();
    }
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
  abrirEnNuevaVentana(url: string | null) {
    if (!url) return;
    window.open(url, '_blank');
  }

  transformarRutaDocumento(path: string | null): string | null {
    if (!path) return null;
    const fileName = path.split(/\\|\//).pop();
    return fileName ? `http://localhost:8080/expedientes/${fileName}` : null;
  }
  leerDesdeRutaOUrl(): void {
    if (!this.rutaOUrl.trim()) {
      Swal.fire('Error', 'Debe ingresar una ruta o URL.', 'warning');
      return;
    }
    this.loadingService.show();
    this.expedienteService.obtenerPdfsDesdeRuta(this.rutaOUrl).subscribe({
      next: (pdfs) => {
        this.loadingService.hide();

        if (!pdfs || pdfs.length === 0) {
          Swal.fire('Aviso', 'No se encontraron archivos PDF.', 'info');
          return;
        }

        pdfs.forEach((pdf: any) => {
          const blob = this.base64ToBlob(pdf.base64, 'application/pdf');
          const file = new File([blob], pdf.nombre, { type: 'application/pdf' });

          if (this.tipoExpediente === 'Emisor') {
            this.cargarArchivosDocumentosNuevos([file]);
          } else {
            this.cargarArchivosDocumentos([file]);
          }
        });

        Swal.fire('Éxito', `${pdfs.length} archivos PDF listos para registrar.`, 'success');
      },
      error: (err) => {
        this.loadingService.hide();
        console.error(err);
        Swal.fire('Error', 'No se pudieron leer los archivos PDF.', 'error');
      }
    });
  }
  cargarArchivosDocumentos(files: File[]) {
    console.log('[DEBUG] Archivos a procesar (Receptor):', files);
    for (const archivo of files) {
      if (archivo.type !== 'application/pdf') {
        console.warn('[AVISO] Archivo ignorado (no es PDF):', archivo.name);
        continue;
      }

      const nuevo: DocumentoExpediente = {
        nombre: archivo.name,
        archivo,
        flujo: [],              // ← campo obligatorio según tu interfaz
        areas: [],              // ← campo obligatorio según tu interfaz
        cargado: false,
        progreso: 0,
        visibleParaExternos: false,
        tipoDocumento: '',
        esExistente: false
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

  base64ToBlob(base64: string, type: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  }
  onFileSelected(event: any) {
    const files: FileList = event.target.files;

    for (let i = 0; i < files.length; i++) {
      const archivo = files[i];
      this.documentos.push({
        nombre: archivo.name,
        archivo: archivo,
        tipoDocumento: '',
        visibleParaExternos: false,
        flujo: [],
        areas: [],
        cargado: true,
        esExistente: false
      });
    }
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

  obtenerUsuariosPorTipo(lista: UsuarioVisual[], tipo: UsuarioVisual['tipoIdentidad']): UsuarioVisual[] {
    return lista.filter(u => u.tipoIdentidad === tipo);
  }
  obtenerReferenciasPorTipo(tipo: Referencia['tipo']): Referencia[] {
    return this.referenciasFiltradas.filter(r => r.tipo === tipo);
  }
  obtenerUsuariosPorTipoFirma(lista: Usuario[], tipo: Usuario['tipoUsuario']): UsuarioVisual[] {
    return lista.filter(u => u.tipoUsuario === tipo);
  }

  desenfocarYabrir(element: HTMLElement, valor: string, destino: 'to' | 'cc' | 'nivel') {
    element.blur(); // Remueve el foco
    this.abrirDialogoAgregarUsuario(valor, destino);
  }

  // Diálogos
  abrirDialogoAgregarUsuario(nombre: string, destino: 'to' | 'cc' | 'nivel') {
    setTimeout(() => {
      const dialogRef = this.dialog.open(DocumentoAgregarComponent, {
        width: '800px',  // o incluso '90vw' si quieres algo más flexible
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
      next: usuarios => {

        const usuariosTransformados: Usuario[] = usuarios.map(user => ({
          ...user,
          tipoUsuario: user.tipoUsuario?.toUpperCase() || '',
          tipoIdentidad: user.tipoIdentidad?.toUpperCase() || '',
        }));

        this.grupoAreaService.listar().subscribe(grupos => {
          const gruposComoUsuarios: GrupoVisual[] = grupos.map(grupo => ({
            id: `grupo-${grupo.id}`,
            nombre: grupo.nombre,
            tipoUsuario: 'GRUPO',
            correo: 'Grupo de usuarios',
            tipoIdentidad: 'GRUPO',
            idsUsuarios: grupo.usuariosIds.split('|').map(id => parseInt(id, 10))
          }));

          // Mezcla usuarios + grupos
          this.todosUsuarios = [...usuariosTransformados, ...gruposComoUsuarios];
          this.usuariosFiltradosTo = [...this.todosUsuarios];
          this.usuariosFiltradosCc = [...this.todosUsuarios];
          this.usuariosInternos = usuarios.filter(u => u.firmante === 1);
          // Asegúrate que "GRUPO" esté como tipo visible
          if (!this.tiposUsuario.includes('GRUPO')) {
            this.tiposUsuario.push('GRUPO');
          }

          // Reasigna controles
          this.controlUsuario.setValue(this.controlUsuario.value || []);
          this.controlUsuarioCc.setValue(this.controlUsuarioCc.value || []);

          // Reaplica filtros
          this.filtrarUsuariosTo();
          this.filtrarUsuariosCc();

          console.log('[DEBUG] Usuarios y grupos recargados correctamente');
        });
      },
      error: err => {
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
    this.tiposReferencia = ['Documento', 'Expediente'];
    this.filtrarReferencias();

    // Fecha actual
    const hoy = new Date();
    const offset = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - offset).toISOString().slice(0, 10);
    this.formularioPaso1.patchValue({ fecha: fechaLocal });
  }

  irARegistroExpediente() {
    Swal.fire({
      title: '¿Iniciar nuevo expediente?',
      text: 'En caso no haya guardado, se perderán todos los datos ingresados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#004C77',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Sí, limpiar todo',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Paso 1 y tipo
        this.pasoActual = 1;
        this.tipoExpediente = null;
        this.modoFlujoFirma = 'individual';
        this.arrastrando = false;
        this.isLoading = false;
        // Reset formulario principal
        this.formularioPaso1.reset();

        // Controles específicos
        this.controlUsuario.setValue([]);
        this.controlUsuarioCc.setValue([]);
        this.controlReferencia.setValue([]);
        this.documentosExistentes = [];
        this.documentosNuevos = [];
        // Parchar valores por defecto (evita que queden en null)
        this.formularioPaso1.patchValue({
          proyecto: '',
          reservado: '',
          fecha: '',
          comentario: '',
          asunto: ''
        });
        this.nivelesFirmaGenerales = [];
        const limpiarNiveles = (niveles: any[]) => {
          niveles.forEach(n => {
            n.controlUsuarios?.setValue([]);
            n.searchControl?.setValue('');
            n.fechaLimite = '';
          });
        };
        this.documentosNuevos.forEach(doc => {
          if (doc.nivelesFirma) limpiarNiveles(doc.nivelesFirma);
        });

        this.documentosExistentes.forEach(doc => {
          if (doc.nivelesFirma) limpiarNiveles(doc.nivelesFirma);
        });

        limpiarNiveles(this.nivelesFirmaGenerales);
        // Borrar documentos (paso 3)
        this.documentos = [];

        // Borrar archivo cargo (paso 4)
        this.cargo = undefined;

        // Reset de fecha/hora del cargo
        this.fechaCargo = '';
        this.horaCargo = '';
        this.inicializarFechaYHoraCargo(); // si quieres dejar la fecha actual

        // Reset de estado
        this.expedienteIdRegistrado = undefined;
        this.exito = false;

        // Filtros de búsqueda (usuarios y referencias)
        this.searchCtrlUsuario.setValue('');
        this.searchCtrlCc.setValue('');
        this.searchCtrlReferencia.setValue('');

        this.filtroTipoUsuarioTo = '';
        this.filtroTipoUsuarioCc = '';
        this.filtroTipoReferencia = '';

        this.usuariosFiltradosTo = [...this.todosUsuarios];
        this.usuariosFiltradosCc = [...this.todosUsuarios];
        this.referenciasFiltradas = [...this.referenciasOriginales];
      }
    });
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
    console.log("regresando al paso", this.pasoActual - 1);
    if (this.pasoActual === 3) {
      this.nivelesFirmaGenerales = [];
      const limpiarNiveles = (niveles: any[]) => {
        niveles.forEach(n => {
          n.controlUsuarios?.setValue([]);
          n.searchControl?.setValue('');
          n.fechaLimite = '';
        });
      };
      this.documentosNuevos.forEach(doc => {
        if (doc.nivelesFirma) limpiarNiveles(doc.nivelesFirma);
      });

      this.documentosExistentes.forEach(doc => {
        if (doc.nivelesFirma) limpiarNiveles(doc.nivelesFirma);
      });
      this.documentosExistentes = [];
      this.documentosNuevos = [];
      this.modoFlujoFirma = 'individual';
    }
    if (this.pasoActual === 2) {
      this.tipoExpediente = null;
      this.modoFlujoFirma = 'individual';
      this.arrastrando = false;
      this.isLoading = false;
      // Reset formulario principal
      this.formularioPaso1.reset();

      // Controles específicos
      this.controlUsuario.setValue([]);
      this.controlUsuarioCc.setValue([]);
      this.controlReferencia.setValue([]);
      this.documentosExistentes = [];
      this.documentosNuevos = [];
      // Parchar valores por defecto (evita que queden en null)
      this.formularioPaso1.patchValue({
        proyecto: '',
        reservado: '',
        fecha: '',
        comentario: '',
        asunto: ''
      });
      this.nivelesFirmaGenerales = [];
      const limpiarNiveles = (niveles: any[]) => {
        niveles.forEach(n => {
          n.controlUsuarios?.setValue([]);
          n.searchControl?.setValue('');
          n.fechaLimite = '';
        });
      };
      this.documentosNuevos.forEach(doc => {
        if (doc.nivelesFirma) limpiarNiveles(doc.nivelesFirma);
      });

      this.documentosExistentes.forEach(doc => {
        if (doc.nivelesFirma) limpiarNiveles(doc.nivelesFirma);
      });

      limpiarNiveles(this.nivelesFirmaGenerales);
      // Borrar documentos (paso 3)
      this.documentos = [];

      // Borrar archivo cargo (paso 4)
      this.cargo = undefined;

      // Reset de fecha/hora del cargo
      this.fechaCargo = '';
      this.horaCargo = '';

      // Reset de estado
      this.expedienteIdRegistrado = undefined;
      this.exito = false;

      // Filtros de búsqueda (usuarios y referencias)
      this.searchCtrlUsuario.setValue('');
      this.searchCtrlCc.setValue('');
      this.searchCtrlReferencia.setValue('');

      this.filtroTipoUsuarioTo = '';
      this.filtroTipoUsuarioCc = '';
      this.filtroTipoReferencia = '';

      this.usuariosFiltradosTo = [...this.todosUsuarios];
      this.usuariosFiltradosCc = [...this.todosUsuarios];
      this.referenciasFiltradas = [...this.referenciasOriginales];
    }
    this.pasoActual--;
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
        archivo: archivo,
        flujo: [],
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
  validarFechasNiveles(niveles: any[]): boolean {
    for (let i = 1; i < niveles.length; i++) {
      const actual = new Date(niveles[i].fechaLimite);
      const anterior = new Date(niveles[i - 1].fechaLimite);
      if (actual < anterior) return false;
    }
    return true;
  }

  registrarFlujosEmisor() {
    // Combinar documentos referenciados que requieren firma
    const docsFirmablesExistentes = this.documentosExistentes.filter(d => d.requiereFirma);
    const docsFirmablesNuevos = this.documentosNuevos;

    // --- Modo General ---
    if (this.modoFlujoFirma === 'general') {
      const todosDocsIds = [...docsFirmablesExistentes, ...docsFirmablesNuevos].map(d => d.id).join('|');

      for (let i = 0; i < this.nivelesFirmaGenerales.length; i++) {
        const nivel = this.nivelesFirmaGenerales[i];
        const usuarios = this.obtenerIdsPorNombres(nivel.controlUsuarios.value || []);
        const fecha = nivel.fechaLimite;

        const flujoData = {
          tipo_nivel: 'General',
          nivel: i + 1,
          usuarios: usuarios,
          expediente_id: this.expedienteIdRegistrado,
          documentos_id: todosDocsIds,
          fecha_limite: fecha,
          estado: 'PENDIENTE',
          modoConexion: nivel.modoConexion
        };

        if (!this.validarFechasNiveles(this.nivelesFirmaGenerales)) {
          Swal.fire('Error', 'Las fechas límite deben estar en orden ascendente por nivel.', 'error');
          return;
        }

        this.expedienteService.registrarFlujoProceso(flujoData).subscribe({
          next: () => console.log(`[✔] Nivel general ${i + 1} registrado`),
          error: err => console.error(`[✖] Error registrando nivel general ${i + 1}:`, err)
        });
      }
    }

    // --- Modo Individual ---
    if (this.modoFlujoFirma === 'individual') {
      const todosDocs = [...docsFirmablesExistentes, ...docsFirmablesNuevos];

      for (const doc of todosDocs) {
        if (!doc.nivelesFirma) continue;

        for (let i = 0; i < doc.nivelesFirma.length; i++) {
          const nivel = doc.nivelesFirma[i];
          const usuarios = this.obtenerIdsPorNombres(nivel.controlUsuarios.value || []);
          const fecha = nivel.fechaLimite;

          const flujoData = {
            tipo_nivel: 'Especifico',
            nivel: i + 1,
            usuarios: usuarios,
            expediente_id: this.expedienteIdRegistrado,
            documentos_id: doc.id.toString(),
            fecha_limite: fecha,
            estado: 'PENDIENTE',
            modoConexion: nivel.modoConexion
          };

          this.expedienteService.registrarFlujoProceso(flujoData).subscribe({
            next: () => console.log(`[✔] Nivel específico ${i + 1} para doc ${doc.nombre || doc.nombreArchivo} registrado`),
            error: err => console.error(`[✖] Error registrando nivel específico doc ${doc.nombre || doc.nombreArchivo}:`, err)
          });
        }
      }
    }
  }

  onSubmit() {
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
    console.log(this.tipoExpediente);
    if (this.tipoExpediente === 'Emisor') {
      console.log("Estoy por registrar un expediente emisor");
      if (!this.validarNivelesFirma()) {
        Swal.fire({
          title: 'Error de validación',
          text: 'Todos los documentos que requieren firma deben tener al menos un nivel con usuarios asignados.',
          icon: 'error',
          confirmButtonColor: '#004C77'
        });
        return;
      }

      this.expedienteService.registrarExpediente(expedienteData).subscribe({
        next: (expediente) => {
          this.expedienteIdRegistrado = expediente.id;
          // Registrar los documentos nuevos si existen
          const uploadsNuevos = this.documentosNuevos.map(doc => {
            const formData = new FormData();
            formData.append('file', doc.archivo);
            formData.append('nombreArchivo', doc.nombre);
            formData.append('tipoDocumento', doc.tipoDocumento || '');
            formData.append('visibleParaExternos', String(doc.visibleParaExternos ?? false));
            formData.append('tamaño', doc.archivo.size.toString());

            return this.expedienteService.registrarDocumento(expediente.id, formData);
          });
          this.loadingService.show();

          // Ejecutar y esperar todos los documentos nuevos antes de registrar los flujos
          Promise.all(uploadsNuevos.map(u => u.toPromise())).then((documentosNuevosRegistrados) => {
            // Guardar los nuevos con sus IDs
            documentosNuevosRegistrados.forEach((docRegistrado, i) => {
              this.documentosNuevos[i].id = docRegistrado.id;
            });

            this.registrarFlujosEmisor();
          });

          // Registrar auditoría solo por expediente
          this.auditoriaService.registrarAuditoria({
            usuario: usuarioActual?.id,
            accion: 'CREACION',
            expedienteId: expediente.id,
            descripcion: 'Registro de expediente tipo Emisor'
          }).subscribe({
            next: () => console.log('[AUDITORIA] Registrada'),
            error: err => console.error('[AUDITORIA] Error al registrar', err)
          });

          Swal.fire({
            title: 'Expediente registrado',
            text: 'El expediente fue creado correctamente.',
            icon: 'success',
            confirmButtonColor: '#004C77'
          }).then(() => {
            this.loadingService.hide();
            this.pasoActual = 4;
            this.exito = true;
          });
        },
        error: (err) => {
          this.loadingService.hide();
          console.error('[✖] Error al registrar expediente Emisor:', err);
          Swal.fire('Error', 'No se pudo registrar el expediente.', 'error');
        }
      });

      return;
    }
    if (this.documentos.length === 0 || !this.todosLosDocumentosTienenTipo()) return;

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
                allowOutsideClick: false,
                allowEscapeKey: false,
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
          allowOutsideClick: false,
          allowEscapeKey: false,
          icon: 'error'
        });
      }

    });
    function validarFechasNiveles(niveles: any[]): boolean {
      for (let i = 1; i < niveles.length; i++) {
        const actual = new Date(niveles[i].fechaLimite);
        const anterior = new Date(niveles[i - 1].fechaLimite);
        if (actual < anterior) return false;
      }
      return true;
    }

  }
  obtenerReferenciasFinales(): string | null {
    const referencias: ReferenciaCompleta[] = this.controlReferencia.value || [];
    if (!referencias.length) return null;

    return referencias.map(ref => ref.serie).join('|');
  }
  validarFechasEnCascada(niveles: any[]) {
    for (let i = 1; i < niveles.length; i++) {
      const fechaAnterior = new Date(niveles[i - 1].fechaLimite);
      const fechaActual = new Date(niveles[i].fechaLimite);

      if (niveles[i].fechaLimite && fechaActual < fechaAnterior) {
        niveles[i].fechaLimite = null;
      }
    }
  }
  resetearFormularioCompleto(): void {
    this.formularioDocumento.reset(); // Reset del formGroup principal
    this.formularioPaso1.reset(); // Reset del formGroup principal

    // Reset manual de propiedades personalizadas
    this.documentosExistentes = [];
    this.documentosNuevos = [];
    this.nivelesFirmaGenerales = [];

    this.tipoExpediente = null;
    this.modoFlujoFirma = 'individual';
    this.isLoading = false;
  }

  validarNivelesFirma(): boolean {
    // Si estamos en modo general, validar niveles generales
    if (this.modoFlujoFirma === 'general') {
      if (!this.nivelesFirmaGenerales || this.nivelesFirmaGenerales.length === 0) {
        console.warn('[✖] No se han definido niveles de firma general.');
        return false;
      }

      for (const nivel of this.nivelesFirmaGenerales) {
        if (!nivel.controlUsuarios?.value || nivel.controlUsuarios.value.length === 0) {
          console.warn('[✖] Un nivel general no tiene usuarios asignados.');
          return false;
        }

        if (!nivel.fechaLimite) {
          console.warn('[✖] Un nivel general no tiene fecha límite asignada.');
          return false;
        }
      }

      return true;
    }

    // Validar niveles en documentos heredados que requieren firma
    for (const doc of this.documentosExistentes) {
      if (doc.requiereFirma && (!doc.nivelesFirma || doc.nivelesFirma.length === 0)) {
        console.warn(`[✖] El documento heredado "${doc.nombreArchivo}" requiere firma pero no tiene niveles.`);
        return false;
      }
    }

    // Validar niveles en documentos nuevos (todos requieren firma)
    for (const doc of this.documentosNuevos) {
      if (!doc.nivelesFirma || doc.nivelesFirma.length === 0) {
        console.warn(`[✖] El documento nuevo "${doc.nombre}" no tiene niveles de firma asignados.`);
        return false;
      }

      // Verifica que cada nivel tenga al menos un usuario
      for (const nivel of doc.nivelesFirma) {
        if (!nivel.controlUsuarios?.value || nivel.controlUsuarios.value.length === 0) {
          console.warn(`[✖] El documento nuevo "${doc.nombre}" tiene un nivel sin usuarios asignados.`);
          return false;
        }
        // Validar fecha
        if (!nivel.fechaLimite) {
          console.warn(`[✖] El documento nuevo "${doc.nombre}" tiene un nivel sin fecha límite.`);
          return false;
        }
      }
    }

    return true;
  }

  esFlujoValido(): boolean {
    if (this.modoFlujoFirma === 'general') {
      if (this.nivelesFirmaGenerales.length === 0) return false;

      for (const nivel of this.nivelesFirmaGenerales) {
        if (!nivel.fechaLimite || nivel.controlUsuarios.value?.length === 0) return false;
      }

      return true;
    }

    if (this.modoFlujoFirma === 'individual') {
      for (const doc of this.documentosExistentes) {
        if (!doc.nivelesFirma || doc.nivelesFirma.length === 0) return false;

        for (const nivel of doc.nivelesFirma) {
          if (!nivel.fechaLimite || nivel.controlUsuarios.value?.length === 0) return false;
        }
      }

      return true;
    }

    return false;
  }

  obtenerIdsPorNombres(nombresSeleccionados: string[]): string {
    const ids: string[] = [];

    for (const nombre of nombresSeleccionados) {
      const usuario = this.todosUsuarios.find(u => u.nombre === nombre);

      if (!usuario) continue;

      if (usuario.tipoUsuario === 'GRUPO' && 'idsUsuarios' in usuario) {
        ids.push(...usuario.idsUsuarios.map(id => id.toString()));
      } else if (usuario.id !== undefined && usuario.id !== null) {
        ids.push(usuario.id.toString());
      } else {
        console.warn(`Usuario sin ID válido encontrado: ${usuario.nombre}`);
      }
    }

    return Array.from(new Set(ids)).join('|'); // Elimina duplicados y une con '|'
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
              allowOutsideClick: false,
              allowEscapeKey: false,
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
          allowOutsideClick: false,
          allowEscapeKey: false,
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

  onScanUpload(event: Event): void {
    const archivo = (event.target as HTMLInputElement).files?.[0];
    if (!archivo) return;
    console.log('Subiendo archivo OCR:', archivo.name);
    this.loadingService.show();
    this.ocrService.escanearDocumento(archivo).subscribe({
      next: (res) => {
        this.loadingService.hide();
        console.log('Texto extraído del documento:', res);
      },
      error: (err) => {
        console.error('Error al escanear el documento:', err);
      }
    });
  }

  scanCarta(): void {
    const dialogRef = this.dialog.open(ScanCartaComponent, {
      width: '95vw',
      maxHeight: '95vh',
      panelClass: 'custom-dialog-container',
      autoFocus: false
    });


    dialogRef.afterClosed().subscribe(resultados => {
      if (!resultados || !Array.isArray(resultados)) return;

      for (const resultado of resultados) {
        const texto = resultado.texto.trim();
        const destino = resultado.destino;

        if (destino === 'asunto') {
          this.formularioPaso1.patchValue({
            asunto: texto
          });
        }

        if (destino === 'emisor' || destino === 'destinatario') {
          const coincidencia = this.todosUsuarios.find(u =>
            u.nombre.toLowerCase().includes(texto.toLowerCase())
          );

          if (coincidencia) {
            if (destino === 'emisor') {
              this.controlUsuario.setValue([coincidencia.nombre]);
            } else {
              this.controlUsuarioCc.setValue([coincidencia.nombre]);
            }
          } else {
            this.abrirDialogoAgregarUsuario(texto, destino === 'emisor' ? 'to' : 'cc');
          }
        }

        if (destino === 'referencia') {
          const coincidencia = this.referenciasOriginales.find(r =>
            r.serie.toLowerCase().includes(texto.toLowerCase())
          );

          if (coincidencia) {
            this.controlReferencia.setValue([coincidencia]);
          } else {
            const nuevaRef = {
              serie: texto,
              asunto: '(Referencia manual)',
              tipo: 'MANUAL' as const
            };
            this.controlReferencia.setValue([...(this.controlReferencia.value || []), nuevaRef]);
          }
        }
      }
    });

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
        allowOutsideClick: false,
        allowEscapeKey: false,
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
          allowOutsideClick: false,
          allowEscapeKey: false,
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
          allowOutsideClick: false,
          allowEscapeKey: false,
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
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonColor: '#F36C21'
    }).then(() => {
      console.log(this.expedienteIdRegistrado);

      this.router.navigate(['/detalle-expediente', this.expedienteIdRegistrado]).then(() => {
        this.expedienteIdRegistrado = undefined;  // Limpiar variable después de navegar
      });
    });
  }

}
