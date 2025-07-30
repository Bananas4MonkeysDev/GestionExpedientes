import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DialogoCargoComponent } from '../../../modal/dialogo-cargo/dialogo-cargo.component'; // Ajusta si tu ruta es distinta
import { CommonModule } from '@angular/common';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { ExpedienteService } from '../../../../../core/services/expediente.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { Referencia, ReferenciaService } from '../../../../../core/services/referencia.service';
import { DocumentoAgregarComponent } from '../../../modal/documento-agregar/documento-agregar.component';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { UsuarioService } from '../../../../../core/services/usuario.service';
import { forkJoin } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LoadingOverlayService } from '../../../../../core/services/loading-overlay.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { AuditoriaService } from '../../../../../core/services/auditoria.service';
import { ReferenciaAgregarComponent } from '../../../modal/referencia-agregar/referencia-agregar.component';
import { Proyecto } from '../../../../../core/models/proyecto.model';
import { ProyectoService } from '../../../../../core/services/proyecto.service';
enum EstadoProcesoReceptor {
  INICIAL = 'INICIAL',
  CREANDO = 'CREANDO',
  CREADO = 'CREADO',
  APROBANDO = 'APROBANDO',
  APROBADO = 'APROBADO',
  CARGADO = 'CARGADO'
}
export interface FlujoProceso {
  id: number;
  estado: 'PENDIENTE' | 'FIRMADO';
  expediente_id: number;
  fecha_limite: string;
  nivel: number;
  tipo_nivel: 'General' | 'Especifico';
  documentos_id: string; // Puedes parsearlo a string[] si deseas luego
  usuarios: string; // Ej: "10|12|3"
}
interface NivelFirma {
  usuarios: string[];
  usuarioSeleccionado?: string;
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
interface DocumentoExistente {
  id?: number;
  nombreArchivo: string;
  tipoDocumento?: string;
  rutaArchivo?: string;
  tamaño?: number;
  visibleParaExternos?: boolean;
  esExistente: true; // para diferenciarlos
}

interface DocumentoNuevo {
  id?: any;
  nombre: string;
  archivo: File;
  cargado?: boolean;
  progreso?: number;
  visibleParaExternos?: boolean;
  tipoDocumento?: string;
  esExistente: false;
  requiereFirma?: boolean;
  nivelesFirma?: any;
}

interface DocumentoExpediente {
  id?: number;
  nombreArchivo: string;
  tipoDocumento?: string;
  rutaArchivo?: string;
  tamaño?: number;
  visibleParaExternos?: boolean;
  esExistente: true;
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

@Component({
  selector: 'app-expediente-detalle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
    MatIconModule],
  templateUrl: './expediente-detalle.component.html',
  styleUrls: ['./expediente-detalle.component.css'],
})
export class ExpedienteDetalleComponent implements OnInit {
  currentUser: any;

  seccion: 'expediente' | 'documentos' | 'cargo' | 'estado' | 'auditoria' = 'expediente';
  expediente: any = null;
  modoEdicionExpediente = false;
  minDateString: string | undefined;
  formularioPaso1!: FormGroup;
  controlUsuario = new FormControl<string[]>([], Validators.required);
  controlUsuarioCc = new FormControl<string[]>([], Validators.required);
  controlReferencia = new FormControl<string[]>([], Validators.required);
  todosUsuarios: Usuario[] = [];
  searchCtrlUsuario = new FormControl('');
  searchCtrlCc = new FormControl('');
  nombreProyectoSeleccionado: string = '';
  searchCtrlReferencia = new FormControl('');
  filtroTipoUsuarioTo = '';
  filtroTipoUsuarioCc = '';
  filtroTipoReferencia = '';
  usuariosFiltradosTo: Usuario[] = [];
  usuariosFiltradosCc: Usuario[] = [];
  referenciasFiltradas: Referencia[] = [];
  usuariosInternos: any[] = [];
  usuariosInternosFiltrados: Usuario[] = [];
  referenciasOriginales: Referencia[] = [];
  tiposUsuario: Usuario['tipoIdentidad'][] = ['PERSONA', 'GRUPO', 'ENTIDAD'];
  tiposReferencia: Referencia['tipo'][] = ['Documento', 'Expediente'];
  proyectos: Proyecto[] = [];
  documentosExistentes: DocumentoExpediente[] = [];
  documentosNuevos: DocumentoNuevo[] = [];
  modoEdicionFlujos: boolean = false;
  arrastrando = false;
  tiposDocumento = ['Anexos', 'Actas', 'Carta', 'Oficio', 'Contrato', 'Adenda', 'Solicitud de compra', 'Cotizaciones', 'Cuadro Comparativo', 'Orden de Compra', 'Guia', 'Factura', 'Informe', 'Anexo'];
  historialCargos: any[] = [];
  isLoading = false;
  auditorias: any[] = [];
  referencias: Referencia[] = [];
  esAnulado: boolean = false;
  etapaSeleccionada: 'CREACION' | 'APROBACION' | 'CARGO' | '' = '';
  estadoProcesoIndex: number = 0; // 0 = en creación, 1 = aprobación, 2 = esperando cargo, 3 = cargo generado
  flujosIndividuales: FlujoProceso[] = [];
  flujosGenerales: FlujoProceso[] = [];
  nivelesFirmaGenerales: any[] = [];
  tiposUsuarioFirma: Usuario['tipoUsuario'][] = ['INTERNO', 'EXTERNO', 'ADMIN'];
  modoFlujoFirma: 'individual' | 'general' = 'general';
  botonDeshabilitado: boolean = false;
  nivelesEliminadosPorDocId: { [docId: number]: number[] } = {};
  nivelesFirmaGeneralOriginal: any[] = [];
  nivelesFirmaEspecificoOriginal: any[] = [];

  documentosDeFlujo: {
    id: number;
    nombreArchivo: string;
    rutaArchivo: string;
    tipoDocumento: string;
    tamaño: number;
    visibleParaExternos: boolean;
    esExistente: boolean,
    requiereFirma?: boolean;
    nivelesFirma?: any;
  }[] = [];
  nivelesFirmaGeneral: {
    nivel: number;
    usuarios: any[];
    fechaLimite: string;
    estado: string;
  }[] = [];
  nivelesFirmaPorDocumento: {
    documentoId: number;
    niveles: {
      nivel: number;
      usuarios: any[];
      fechaLimite: string;
      estado: string;
    }[];
  }[] = [];

  constructor(private proyectoService: ProyectoService, private router: Router, private auditoriaService: AuditoriaService, private authService: AuthService, private loadingService: LoadingOverlayService,
    private sanitizer: DomSanitizer, private zone: NgZone, private route: ActivatedRoute, private cdr: ChangeDetectorRef, private expedienteService: ExpedienteService, private dialog: MatDialog, private usuarioService: UsuarioService, private referenciaService: ReferenciaService) { }
  @ViewChild('slider', { static: false }) sliderRef!: ElementRef;
  reiniciarFiltroTipoReferencia() {
    this.filtroTipoReferencia = '';
    this.filtrarReferencias();
  }
  obtenerUsuariosPorTipo(lista: Usuario[], tipo: Usuario['tipoIdentidad']): Usuario[] {
    return lista.filter(u => u.tipoIdentidad === tipo);
  }
  abrirEnNuevaVentana(url: string) {
    window.open(url, '_blank');
  }
  actualizarNivelesGeneralesExistentes(): Promise<any[]> {
    console.log("niveles generales:", this.nivelesFirmaGenerales);
    const actualizaciones = this.nivelesFirmaGenerales
      .filter(n => n.id != null) // Solo los ya existentes
      .map((nivel, i) => {
        const usuarios = this.obtenerIdsPorNombres(nivel.controlUsuarios?.value || []);
        const flujoActualizado = {
          tipo_nivel: 'General',
          nivel: i + 1,
          usuarios: usuarios,
          expediente_id: this.expediente.id,
          documentos_id: this.obtenerTodosLosIdsDeDocumentosFirmables().join('|'),
          fecha_limite: nivel.fechaLimite,
          estado: nivel.estado || 'PENDIENTE'
        };

        console.log("[FRONT] Actualizando flujo ID:", nivel.id, flujoActualizado);
        console.log("[FRONT] Preparando actualización del flujo general:");
        console.log("Nivel:", i + 1);
        console.log("Usuarios:", usuarios);
        console.log("Documentos:", this.obtenerTodosLosIdsDeDocumentosFirmables());
        console.log("Fecha Límite:", nivel.fechaLimite);

        return this.expedienteService
          .actualizarFlujoProceso(nivel.id, flujoActualizado)
          .toPromise();
      });

    return Promise.all(actualizaciones);
  }
  obtenerTodosLosIdsDeDocumentosFirmables(): number[] {
    const idsExistentes = this.documentosDeFlujo
      .filter(doc => doc.requiereFirma && doc.id != null)
      .map(doc => doc.id);

    const idsNuevos = this.documentosNuevos
      .filter(doc => doc.requiereFirma && doc.id != null)
      .map(doc => doc.id);

    return [...idsExistentes, ...idsNuevos];
  }

  // expediente-detalle.component.ts
  guardarCambiosFlujos() {
    console.log("Guardando cambios...");
    if (!this.validarNivelesFirma()) {
      Swal.fire({
        title: 'Error de validación',
        text: 'Todos los documentos que requieren firma deben tener al menos un nivel con usuarios asignados.',
        icon: 'error',
        confirmButtonColor: '#004C77'
      });
      return;
    }
    const expedienteId = this.expediente.id;
    const usuarioActual = this.authService.getUserFromToken();
    console.log("expediente id:", expedienteId);
    console.log("usuario actual:", usuarioActual);
    const uploadsNuevos = this.documentosNuevos.map(doc => {
      const formData = new FormData();
      formData.append('file', doc.archivo);
      formData.append('nombreArchivo', doc.nombre);
      formData.append('tipoDocumento', doc.tipoDocumento || '');
      formData.append('visibleParaExternos', String(doc.visibleParaExternos ?? false));
      formData.append('tamaño', doc.archivo.size.toString());

      return this.expedienteService.registrarDocumento(expedienteId, formData);
    });
    this.loadingService.show();

    Promise.all(uploadsNuevos.map(u => u.toPromise()))
      .then(async (documentosRegistrados) => {
        documentosRegistrados.forEach((docRegistrado, i) => {
          this.documentosNuevos[i].id = docRegistrado.id;

          const doc = this.documentosNuevos[i];
          if (
            (this.modoFlujoFirma === 'individual' && doc.nivelesFirma?.length > 0) ||
            (this.modoFlujoFirma === 'general')
          ) {
            doc.requiereFirma = true;
          }
        });

        console.log("Documentos Nuevos registrados:", this.documentosNuevos);
        const nuevosDocIds = this.documentosNuevos.map(d => d.id);

        if (this.modoFlujoFirma === 'individual') {
          Promise.all([
            this.registrarFlujosParaNuevosDocumentos(),
            this.actualizarNivelesEspecificos()            
          ]).then(() => {
            this.finalizarGuardado();
          });

        } else if (this.modoFlujoFirma === 'general') {
          // Primero actualizar flujos existentes con nuevos documentos
          Promise.all([
            this.actualizarDocumentosEnFlujosGenerales(nuevosDocIds),
            this.actualizarNivelesGeneralesExistentes()
          ]).then(() => {
            this.registrarNuevosNivelesGenerales().then(() => {
              this.finalizarGuardado();
            });
          });

        }
      })
      .catch(err => {
        console.error('[✖] Error al guardar cambios:', err);
        this.loadingService.hide();
        Swal.fire('Error', 'No se pudieron guardar los cambios.', 'error');
      });
  }
  finalizarGuardado() {
    Swal.fire({
      title: 'Cambios guardados',
      text: 'Los documentos y flujos se actualizaron correctamente.',
      icon: 'success',
      confirmButtonColor: '#004C77'
    }).then(() => {
      this.modoEdicionFlujos = false;
      this.documentosNuevos = [];
      this.cargarFlujosYDocumentosDeFirma(this.expediente.id);
      this.cdr.detectChanges();
      this.loadingService.hide();
    });
  }
  hayCambiosEnFlujos(): boolean {
    const originalesGeneral = JSON.stringify(this.nivelesFirmaGeneralOriginal || []);
    const actualesGeneral = JSON.stringify(this.nivelesFirmaGenerales || []);
    const originalesEspecifico = JSON.stringify(this.nivelesFirmaEspecificoOriginal || []);
    const actualesEspecifico = JSON.stringify(this.nivelesFirmaPorDocumento || []);

    return originalesGeneral !== actualesGeneral || originalesEspecifico !== actualesEspecifico;
  }

  async actualizarNivelesEspecificos(): Promise<any[]> {
    const actualizaciones: Promise<any>[] = [];

    this.documentosDeFlujo.forEach(doc => {
      const niveles = doc.nivelesFirma || [];

      niveles
        .filter((n: any) => n.id != null)
        .forEach((nivel: any, i: any) => {
          const usuarios = this.obtenerIdsPorNombres(nivel.controlUsuarios?.value || []);
          const payload = {
            id: nivel.id,
            tipo_nivel: 'Especifico',
            nivel: i + 1,
            usuarios,
            expediente_id: this.expediente.id,
            documentos_id: doc.id,
            fecha_limite: nivel.fechaLimite,
            estado: nivel.estado || 'PENDIENTE'
          };
          actualizaciones.push(
            this.expedienteService.actualizarFlujoProceso(nivel.id, payload).toPromise()
          );
        });

      niveles
        .filter((n: any) => n.id == null)
        .forEach((nivel: any, i: any, nuevos: any) => {
          const usuarios = this.obtenerIdsPorNombres(nivel.controlUsuarios?.value || []);
          const nivelesExistentes = niveles.filter((n: any) => n.id != null);

          const siguienteNivel = nivelesExistentes.length + nuevos.indexOf(nivel) + 1;

          const payload = {
            tipo_nivel: 'Especifico',
            nivel: siguienteNivel,
            usuarios,
            expediente_id: this.expediente.id,
            documentos_id: doc.id,
            fecha_limite: nivel.fechaLimite,
            estado: nivel.estado || 'PENDIENTE'
          };
          actualizaciones.push(
            this.expedienteService.registrarFlujoProceso(payload).toPromise()
          );
        });

    });

    return Promise.all(actualizaciones);
  }

  async registrarNuevosNivelesGenerales(): Promise<void> {
    return new Promise((resolve) => {
      const nivelesExistentes = this.nivelesFirmaGeneral.length;
      const nivelesActuales = this.nivelesFirmaGenerales.length;

      if (nivelesActuales <= nivelesExistentes) return resolve();

      const nuevos = this.nivelesFirmaGenerales.slice(nivelesExistentes);

      let pendientes = nuevos.length;
      if (pendientes === 0) return resolve();

      nuevos.forEach((nivel, i) => {
        const usuarios = this.obtenerIdsPorNombres(nivel.controlUsuarios?.value || []);
        const documentosIds = [...this.documentosDeFlujo.map(d => d.id), ...this.documentosNuevos.map(d => d.id)];

        const flujoData = {
          tipo_nivel: 'General',
          nivel: nivelesExistentes + i + 1,
          usuarios: usuarios,
          expediente_id: this.expediente.id,
          documentos_id: documentosIds.join('|'),
          fecha_limite: nivel.fechaLimite,
          estado: 'PENDIENTE'
        };

        this.expedienteService.registrarFlujoProceso(flujoData).subscribe({
          next: () => {
            console.log(`[✔] Nivel general nuevo ${flujoData.nivel} registrado`);
            pendientes--;
            if (pendientes === 0) resolve();
          },
          error: err => {
            console.error(`[✖] Error registrando nuevo nivel general:`, err);
            pendientes--;
            if (pendientes === 0) resolve();
          }
        });
      });
    });
  }

  async registrarFlujosParaNuevosDocumentos(): Promise<void> {
    const docsFirmablesNuevos = this.documentosNuevos.filter(d => d.requiereFirma);
    console.log('[DEBUG] Docs firmables nuevos:', docsFirmablesNuevos);

    if (docsFirmablesNuevos.length === 0) return;
    const registros: Promise<any>[] = [];

    // --- Modo General ---
    if (this.modoFlujoFirma === 'general') {
      const nuevosDocsIds = docsFirmablesNuevos.map(d => d.id).join('|');
      if (!this.validarFechasNiveles(this.nivelesFirmaGenerales)) {
        Swal.fire('Error', 'Las fechas límite deben estar en orden ascendente por nivel.', 'error');
        return;
      }
      for (let i = 0; i < this.nivelesFirmaGenerales.length; i++) {
        const nivel = this.nivelesFirmaGenerales[i];
        const usuarios = this.obtenerIdsPorNombres(nivel.controlUsuarios?.value || []);
        const fecha = nivel.fechaLimite;

        const flujoData = {
          tipo_nivel: 'General',
          nivel: i + 1,
          usuarios: usuarios,
          expediente_id: this.expediente.id,
          documentos_id: nuevosDocsIds,
          fecha_limite: fecha,
          estado: 'PENDIENTE'
        };

        const obs = this.expedienteService.registrarFlujoProceso(flujoData).toPromise();
        registros.push(obs);
      }
    }

    // --- Modo Individual ---
    if (this.modoFlujoFirma === 'individual') {
      for (const doc of docsFirmablesNuevos) {
        if (!doc.nivelesFirma) continue;

        for (let i = 0; i < doc.nivelesFirma.length; i++) {
          const nivel = doc.nivelesFirma[i];
          const usuarios = this.obtenerIdsPorNombres(nivel.controlUsuarios?.value || []);
          const fecha = nivel.fechaLimite;

          const flujoData = {
            tipo_nivel: 'Especifico',
            nivel: i + 1,
            usuarios: usuarios,
            expediente_id: this.expediente.id,
            documentos_id: doc.id.toString(),
            fecha_limite: fecha,
            estado: 'PENDIENTE'
          };

          const obs = this.expedienteService.registrarFlujoProceso(flujoData).toPromise();
          registros.push(obs);

        }
      }
    }
    await Promise.all(registros);
  }
  validarFechasNiveles(niveles: any[]): boolean {
    for (let i = 1; i < niveles.length; i++) {
      const actual = new Date(niveles[i].fechaLimite);
      const anterior = new Date(niveles[i - 1].fechaLimite);
      if (actual < anterior) return false;
    }
    return true;
  }
  async actualizarDocumentosEnFlujosGenerales(nuevosDocIds: number[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.expedienteService.obtenerFlujosPorExpediente(this.expediente.id).subscribe((flujos: any[]) => {
        const flujosGenerales = flujos.filter(f => f.tipoNivel === 'General');
        let pendientes = flujosGenerales.length;

        if (pendientes === 0) return resolve();

        flujosGenerales.forEach(flujo => {
          const existentes = flujo.documentosId?.split('|').map((id: string) => parseInt(id)) || [];
          const nuevos = nuevosDocIds.filter(id => !existentes.includes(id));
          const todos = [...existentes, ...nuevos];

          if (nuevos.length > 0) {
            const flujoActualizado = {
              ...flujo,
              documentos_id: todos.join('|'),
              expediente_id: this.expediente.id,
              tipo_nivel: 'General',
              nivel: flujo.nivel,
              usuarios: flujo.usuarios,
              fecha_limite: flujo.fechaLimite,
              estado: flujo.estado
            };

            this.expedienteService.actualizarFlujoProceso(flujo.id, flujoActualizado).subscribe({
              next: () => {
                console.log(`[✔] Actualizado flujo general nivel ${flujo.nivel}`);
                pendientes--;
                if (pendientes === 0) resolve();
              },
              error: (err: any) => {
                console.error(`[✖] Error actualizando flujo nivel ${flujo.nivel}:`, err);
                pendientes--;
                if (pendientes === 0) resolve();
              }
            });
          } else {
            pendientes--;
            if (pendientes === 0) resolve();
          }
        });
      }, reject);
    });
  }
  cancelarEdicionFlujos() {
    // Aquí puedes restaurar el estado inicial si tienes backup
    console.log("Cancelando edición");
    this.modoEdicionFlujos = false;
  }

  compararReferencias(a: any, b: any): boolean {
    if (!a || !b) return false;
    return a.serie === b.serie;
  }
  removerUsuario(nombre: string): void {
    const actual = this.controlUsuario.value || [];
    this.controlUsuario.setValue(actual.filter(u => u !== nombre));
  }

  removerUsuarioCc(nombre: string): void {
    const actual = this.controlUsuarioCc.value || [];
    this.controlUsuarioCc.setValue(actual.filter(u => u !== nombre));
  }
  desenfocarYabrir(boton: EventTarget | null, nombre: string, destino: 'to' | 'cc' | 'nivel') {
    const htmlBoton = boton as HTMLElement;
    htmlBoton.blur();

    setTimeout(() => {
      this.abrirDialogoAgregarUsuario(nombre, destino);
    }, 100);
  }
  agregarNivel(doc: any) {
    console.log("usuarios internos:", this.usuariosInternos);
    const nivel = {
      controlUsuarios: new FormControl([]),
      searchControl: new FormControl(''),
      filtroTipo: '',
      usuariosFiltrados: [...this.usuariosInternos],
      fechaLimite: ''
    };

    doc.nivelesFirma = doc.nivelesFirma || [];
    doc.nivelesFirma.push(nivel);

    nivel.searchControl.valueChanges.subscribe(() => this.filtrarUsuariosInternos(nivel));
  }
  agregarNivelGeneral() {
    this.nivelesFirmaGenerales.push({
      controlUsuarios: new FormControl<string[]>([]),
      searchControl: new FormControl(''),
      filtroTipo: '',
      usuariosFiltrados: [...this.usuariosInternos]
    });
  }
  mostrarGrupoInternoTipo(tipo: string, nivel: { usuariosFiltrados: Usuario[] }): boolean {
    return nivel.usuariosFiltrados.some((u: Usuario) => u.tipoUsuario === tipo);
  }
  obtenerUsuariosPorTipoFirma(lista: Usuario[], tipo: Usuario['tipoUsuario']): UsuarioVisual[] {
    return lista.filter(u => u.tipoUsuario === tipo);
  }
  mostrarGrupoInterno(tipo: string): boolean {
    return this.usuariosInternosFiltrados.some(user => user.tipoUsuario === tipo);
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
  onMultipleFilesSelectedx(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      console.log('[DEBUG] Archivos seleccionados:', input.files);
      this.cargarArchivosDocumentosNuevos(Array.from(input.files));
    }
  }
  alternarVisibilidadNuevo(index: number) {
    this.documentosNuevos[index].visibleParaExternos = !this.documentosNuevos[index].visibleParaExternos;
  }
  eliminarDocumentoNuevo(index: number) {
    this.documentosNuevos.splice(index, 1);
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
  actualizarEstadoBotonRegistro(): void {
    this.botonDeshabilitado = !this.validarNivelesFirma();
  }
  referenciasLibresSeleccionadas(): Referencia[] {
    const seleccionadasSeries = this.controlReferencia.value || [];
    return this.referenciasOriginales.filter(ref =>
      seleccionadasSeries.includes(ref.serie)
    );
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
    for (const doc of this.documentosDeFlujo) {
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
  eliminarNivelGeneral(index: number) {
    const nivel = this.nivelesFirmaGenerales[index];

    if (!nivel?.id) {
      // Si no tiene ID, es un nivel aún no guardado en el backend
      this.nivelesFirmaGenerales.splice(index, 1);
      return;
    }

    Swal.fire({
      title: '¿Eliminar nivel de firma?',
      text: `Se eliminará el Nivel ${nivel.nivel} permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.expedienteService.eliminarFlujoProceso(nivel.id).subscribe({
          next: () => {
            this.nivelesFirmaGenerales.splice(index, 1);
            Swal.fire('Eliminado', 'Nivel eliminado correctamente.', 'success');
          },
          error: err => {
            console.error('[✖] Error al eliminar flujo:', err);
            Swal.fire('Error', 'No se pudo eliminar el nivel.', 'error');
          }
        });
      }
    });
  }

  eliminarNivel(doc: any, index: number) {
    const nivel = doc.nivelesFirma[index];

    if (!nivel?.id) {
      // Nivel aún no guardado en backend, simplemente lo quitamos del arreglo
      doc.nivelesFirma.splice(index, 1);
      return;
    }

    Swal.fire({
      title: '¿Eliminar nivel de firma?',
      text: `Se eliminará el Nivel ${nivel.nivel} del documento "${doc.nombre || doc.nombreArchivo}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.expedienteService.eliminarFlujoProceso(nivel.id).subscribe({
          next: () => {
            doc.nivelesFirma.splice(index, 1);
            Swal.fire('Eliminado', 'Nivel eliminado correctamente.', 'success');

            // Reordenar niveles localmente (si deseas mantener consistencia visual)
            doc.nivelesFirma.forEach((n: any, idx: number) => {
              n.nivel = idx + 1;
            });

            this.cdr.detectChanges();
          },
          error: err => {
            console.error('[✖] Error al eliminar flujo:', err);
            Swal.fire('Error', 'No se pudo eliminar el nivel.', 'error');
          }
        });
      }
    });
  }

  obtenerIdsPorNombres(nombresSeleccionados: string[]): string {
    const ids = this.todosUsuarios
      .filter(user => nombresSeleccionados.includes(user.nombre))
      .map(user => {
        if (user.id !== undefined && user.id !== null) {
          return user.id.toString();
        } else {
          console.warn(`Usuario sin ID encontrado: ${user.nombre}`);
          return '';
        }
      })
      .filter(id => id !== '');

    return ids.join('|');
  }
  isDocumentoNuevo(doc: DocumentoExpediente | DocumentoNuevo): doc is DocumentoNuevo {
    return !doc.esExistente; // o doc.esExistente === false
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
  removerUsuarioNivel(usuario: string, nivel: any) {
    const actual = nivel.controlUsuarios.value as string[];
    nivel.controlUsuarios.setValue(actual.filter(u => u !== usuario));
  }
  removerUsuarioNivelGeneral(usuario: string, nivel: any) {
    nivel.controlUsuarios.setValue(nivel.controlUsuarios.value.filter((u: string) => u !== usuario));
  }
  reiniciarFiltroInternos(nivel: any) {
    nivel.searchControl.setValue('');
  }
  ngOnInit(): void {
    this.currentUser = this.authService.getUserFromToken();
    console.log("Current User:", this.currentUser);
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    this.minDateString = `${yyyy}-${mm}-${dd}`;
    if (!id) {
      console.error('ID de expediente no proporcionado');
      return;
    }
    this.inicializarFormulario();
    this.cargarUsuarios();
    this.cargarReferencias();
    this.expedienteService.getExpedienteDetalle(id).subscribe({
      next: (data) => {
        console.log('[DEBUG] Datos recibidos del backend:', data);
        console.log('[DEBUG] Usuarios emisores raw:', data.usuariosEmisores);
        console.log('[DEBUG] Usuarios destinatarios raw:', data.usuariosDestinatarios);

        this.documentosExistentes = data.documentos.map((doc: any) => ({
          id: doc.id,
          nombreArchivo: doc.nombreArchivo,
          tipoDocumento: doc.tipoDocumento,
          rutaArchivo: doc.rutaArchivo,
          tamaño: doc.tamaño,
          visibleParaExternos: doc.visibleParaExternos,
          esExistente: true,
        }));
        this.expediente = {
          id: data.expediente.id,
          codigo: data.expediente.codigo,
          tipo: data.expediente.tipoExpediente,
          asunto: data.expediente.asunto,
          fecha: data.expediente.fecha,
          proyecto: data.expediente.proyecto,
          reservado: data.expediente.reservado,
          comentario: data.expediente.comentario,
          estado: data.expediente.estado,
          documentos: data.documentos.map((doc: any) => ({
            id: doc.id,
            nombreArchivo: doc.nombreArchivo,
            tipoDocumento: doc.tipoDocumento,
            rutaArchivo: doc.rutaArchivo,
            tamaño: doc.tamaño,
            visibleParaExternos: doc.visibleParaExternos,
          })),
          cargo: data.cargo
            ? {
              fecha: data.cargo.fecha,
              hora: data.cargo.hora,
              codigo: data.cargo.codigo,
              archivo: data.cargo.archivoPath || null,
              mensaje: data.cargo.mensaje || ''
            }
            : null,

          referencias: data.expediente.referencias
            ? data.expediente.referencias.split('|')
            : [],
          usuariosEmisores: data.usuariosEmisores.map((u: any) => {
            console.log('[DEBUG] Usuario emisor:', u);
            return { nombre: u.nombre, correo: u.correo };
          }),
          usuariosDestinatarios: data.usuariosDestinatarios.map((u: any) => {
            console.log('[DEBUG] Usuario destinatario:', u);
            return { nombre: u.nombre, correo: u.correo };
          })
        };
        if (this.expediente.estado == 'ANULADO') {
          this.esAnulado = true;
        }
        if (this.expediente.referencias && this.referencias?.length) {
          const codigosSeleccionados = this.referencias
            .filter(ref => this.expediente.referencias.includes(ref.serie))
            .map(ref => ref.serie);
          this.controlReferencia.setValue(codigosSeleccionados);
        }
        this.proyectoService.getAll().subscribe(data => {
          this.proyectos = data;
          console.log(this.proyectos);
          if (this.expediente.proyecto) {
            const proyectoEncontrado = this.proyectos.find(p => p.id === Number(this.expediente.proyecto));
            if (proyectoEncontrado) {
              this.nombreProyectoSeleccionado = proyectoEncontrado.nombre;
            }
            console.log(proyectoEncontrado);
            console.log(this.expediente.proyecto);

          }
        });
        console.log('[DEBUG] Objeto expediente armado:', this.expediente);
        this.cdr.detectChanges();

        this.expedienteService.getHistorialCargos(id).subscribe(historial => {
          console.log('[DEBUG] Historial de cargos:', historial); // ← AÑADIDO
          this.historialCargos = historial;
          console.log(this.expediente.cargo);
          this.expediente.cargo = {
            ...historial[0],
            archivo: historial[0]?.archivoPath || ""
          };
          console.log(this.expediente.cargo);
          console.log(this.historialCargos);

          this.estadoProcesoIndex = 0;

          if (this.expediente?.estado === 'PENDIENTE') {
            const cargoRelacionado = this.historialCargos.length > 0;
            console.log(cargoRelacionado);
            console.log('[DEBUG] Estado = PENDIENTE, cargoRelacionado:', cargoRelacionado);

            if (cargoRelacionado) {
              this.estadoProcesoIndex = 4; // caso especial: paso 1 y 3 verdes, paso 2 ambar
            } else {
              this.estadoProcesoIndex = 1;
            }
            console.log('[DEBUG] estadoProcesoIndex asignado:', this.estadoProcesoIndex);

          } else if (this.expediente?.estado === 'APROBADO') {
            const cargoRelacionado = this.historialCargos.length > 0;
            if (cargoRelacionado) {
              this.estadoProcesoIndex = 3;
            } else {
              this.estadoProcesoIndex = 2;
            }
          }
          this.cdr.markForCheck();
        });
        console.log("Id del expediente:", this.expediente.id)
        this.cargarFlujosYDocumentosDeFirma(this.expediente.id);
      },
      error: (err) => {
        console.error('Error al car expediente', err);
      }
    });
  }
  cargarFlujosYDocumentosDeFirma(expedienteId: number) {
    this.expedienteService.obtenerFlujosPorExpediente(expedienteId).subscribe((flujos: any[]) => {
      const idsDocumentos: Set<number> = new Set();

      this.nivelesFirmaGeneral = [];
      this.nivelesFirmaPorDocumento = [];

      flujos.forEach(flujo => {
        const usuariosIds = flujo.usuarios?.split('|').map((id: string) => parseInt(id)) || [];
        const usuariosNombres = usuariosIds.map((id: number) => {
          const u = this.usuariosInternos.find((ui: any) => ui.id === id);
          return u ? u.nombre : `ID ${id}`;
        });

        console.log("flujo detalle:", flujo);
        const nivelBase = {
          id: flujo.id,
          nivel: flujo.nivel,
          usuarios: usuariosIds,
          fechaLimite: flujo.fechaLimite,
          estado: flujo.estado,
          controlUsuarios: new FormControl(usuariosNombres),
          searchControl: new FormControl(''),
          usuariosFiltrados: this.usuariosInternos
        };

        if (flujo.tipoNivel === 'General') {
          const ids = flujo.documentosId
            ?.split('|')
            .map((id: string) => parseInt(id))
            .filter((id: number) => !isNaN(id));

          ids?.forEach((id: number) => idsDocumentos.add(id));

          this.nivelesFirmaGeneral.push(nivelBase);
        } else if (flujo.tipoNivel === 'Especifico') {
          const docId = parseInt(flujo.documentosId);
          if (!isNaN(docId)) {
            idsDocumentos.add(docId);

            let flujoDoc = this.nivelesFirmaPorDocumento.find(f => f.documentoId === docId);
            if (!flujoDoc) {
              flujoDoc = { documentoId: docId, niveles: [] };
              this.nivelesFirmaPorDocumento.push(flujoDoc);
              // Ordenar los niveles específicos por documento
              this.nivelesFirmaPorDocumento.forEach(flujoDoc => {
                flujoDoc.niveles.sort((a, b) => a.nivel - b.nivel);
              });

            }

            if (!flujoDoc.niveles.some(n => n.nivel === flujo.nivel)) {
              flujoDoc.niveles.push(nivelBase);
            } else {
              console.warn(`[WARN] Nivel duplicado detectado en documento ${docId}, nivel: ${flujo.nivel}`);
            }


          }
        }
      });
      this.modoFlujoFirma = this.nivelesFirmaGeneral.length > 0 ? 'general' : 'individual';
      console.log("Modo de Flujo Firma:", this.modoFlujoFirma);
      console.log("Flujo General:", this.nivelesFirmaGeneral);
      console.log("Flujo Especifico:", this.nivelesFirmaPorDocumento);
      const flujosGeneralesFormateados = flujos
        .filter(flujo => flujo.tipoNivel === 'General')
        .map(flujo => {
          const ids = flujo.usuarios?.split('|').map((id: string) => parseInt(id));
          const nombres = ids.map((id: number) => {
            const u = this.usuariosInternos.find(ui => ui.id === id);
            return u ? u.nombre : `ID ${id}`;
          });
          return {
            id: flujo.id,
            nivel: flujo.nivel,
            usuarios: ids,
            fechaLimite: flujo.fechaLimite,
            estado: flujo.estado,
            controlUsuarios: new FormControl(nombres),
            searchControl: new FormControl(''),
            usuariosFiltrados: this.usuariosInternos
          };
        });
      flujosGeneralesFormateados.sort((a, b) => a.nivel - b.nivel);

      // Ahora los asignas todos de golpe:
      this.nivelesFirmaGenerales = [...flujosGeneralesFormateados];
      console.log("Niveles de Firma General", this.nivelesFirmaGeneral)
      this.expedienteService.getPorIds(Array.from(idsDocumentos)).subscribe((documentos: any[]) => {
        console.log("docuemtnos del flujo:", documentos)
        this.documentosDeFlujo = documentos.map(doc => {
          const nivelesEncontrados = this.nivelesFirmaPorDocumento.find(f => f.documentoId === doc.id)?.niveles || [];

          return {
            id: doc.id,
            nombreArchivo: doc.nombreArchivo,
            rutaArchivo: doc.rutaArchivo,
            tipoDocumento: doc.tipoDocumento || '',
            tamaño: doc.tamaño || 0,
            visibleParaExternos: doc.visibleParaExternos,
            esExistente: true,
            requiereFirma: true,
            nivelesFirma: nivelesEncontrados
          };
        });

        // ← este bloque asegura que todos los niveles individuales tienen sus controles listos
        this.documentosDeFlujo.forEach(doc => {
          doc.nivelesFirma?.forEach((nivel: any) => {
            const nombres = nivel.usuarios.map((id: number) => {
              const u = this.usuariosInternos.find((ui: any) => ui.id === id);
              return u ? u.nombre : `ID ${id}`;
            });

            nivel.controlUsuarios = new FormControl(nombres);
            nivel.searchControl = new FormControl('');
            nivel.usuariosFiltrados = this.usuariosInternos;
          });

        });
      });

    });
  }

  restablecerFlujosDesdeOriginal(): void {
    this.nivelesFirmaGenerales = this.nivelesFirmaGeneralOriginal.map(n => ({
      ...n,
      controlUsuarios: new FormControl(n.controlUsuarios.value),
      searchControl: new FormControl(''),
      usuariosFiltrados: this.usuariosInternos
    }));

    this.nivelesFirmaPorDocumento = this.nivelesFirmaEspecificoOriginal.map(doc => ({
      documentoId: doc.documentoId,
      niveles: doc.niveles.map((n: any) => ({
        ...n,
        controlUsuarios: new FormControl(n.controlUsuarios.value),
        searchControl: new FormControl(''),
        usuariosFiltrados: this.usuariosInternos
      }))
    }));

    // Esto asegura que los valores se re-rendericen
    this.cdr.detectChanges();
  }




  onTabChange(tab: 'expediente' | 'documentos' | 'estado' | 'cargo' | 'auditoria'): void {
    this.seccion = tab;
    if (tab === 'auditoria') {
      this.cargarAuditoria();
    }
  }
  removerReferencia(ref: any): void {
    const referenciasActuales = this.controlReferencia.value as any[];

    // Filtrar y quitar la referencia
    const nuevasReferencias = referenciasActuales.filter(r => {
      // Si r es un string, se compara gardirectamente
      if (typeof r === 'string') {
        return r !== ref;
      }
      // Si r es un objeto (Referencia), comparamos por código (serie)
      return r.serie !== ref.serie;
    });

    this.controlReferencia.setValue(nuevasReferencias);
  }

  cargarAuditoria(): void {
    console.log('[AUDITORÍA] Intentando cargar auditoría...');

    if (!this.expediente || !this.expediente.id) {
      console.warn('[AUDITORÍA] Expediente no válido.');
      return;
    }

    this.auditoriaService.getAuditoriasPorExpediente(this.expediente.id).subscribe({
      next: (data) => {
        this.auditorias = data;
        this.cdr.markForCheck();
        console.log('[AUDITORÍA] Auditoría cargada correctamente:', data);
      },
      error: (err) => {
        console.error('[AUDITORÍA] Error al cargar auditoría:', err);
      }
    });
  }


  transformarRutaCargo(path: string): string | null {
    console.log('[DEBUG] path recibido en transformarRutaCargo:', path);
    if (!path) return null;

    const fileName = path.split(/\\|\//).pop();
    const url = fileName ? `http://localhost:8080/files/${fileName}` : null;

    console.log('[DEBUG] archivo convertido a URL:', url);
    return url;
  }

  transformarRutaDocumento(path: string): string | null {
    console.log('[DEBUG] path recibido en transformarRutaDocumento:', path);

    if (!path) return null;
    const fileName = path.split(/\\|\//).pop();
    return fileName ? `http://localhost:8080/expedientes/${fileName}` : null;
  }
  confirmarAnulacion() {
    this.loadingService.show();
    Swal.fire({
      title: '¿Anular expediente?',
      text: 'Esta acción no eliminará el expediente, solo cambiará su estado a "ANULADO".',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#004C77',
      cancelButtonColor: '#F36C21',
      confirmButtonText: 'Sí, anular',
      allowOutsideClick: false,
      allowEscapeKey: false,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.expedienteService.cambiarEstadoExpediente(this.expediente.id, 'ANULADO').subscribe({
          next: () => {
            this.expediente.estado = 'ANULADO';
            Swal.fire('Anulado', 'El expediente fue marcado como ANULADO.', 'success');
            this.cdr.markForCheck();
            const usuario = this.authService.getUserFromToken();
            this.auditoriaService.registrarAuditoria({
              usuario: usuario?.id,
              accion: 'EDICION',
              expedienteId: this.expediente.id,
              descripcion: 'El expediente fue anulado (cambio de estado a ANULADO)'
            }).subscribe({
              next: () => console.log('[AUDITORIA] Expediente anulado registrado'),
              error: err => console.error('[AUDITORIA] Error al registrar auditoría de anulación', err)
            });
            this.cargarAuditoria();
            this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
              this.router.navigate(['/detalle-expediente', this.expediente.id]);
            });
            this.loadingService.hide();

          },
          error: () => {
            Swal.fire('Error', 'No se pudo anular el expediente', 'error');
            this.loadingService.hide();

          }
        });
      }
    });
  }


  scrollSlider(direction: 'left' | 'right') {
    const slider = this.sliderRef.nativeElement as HTMLElement;
    slider.scrollBy({ left: direction === 'left' ? -250 : 250, behavior: 'smooth' });
  }
  eliminarCargo(): void {
    this.expediente.cargo = null;
  }
  inicializarFormulario() {
    this.formularioPaso1 = new FormGroup({
      asunto: new FormControl('', Validators.required),
      fecha: new FormControl('', Validators.required),
      comentario: new FormControl(''),
      proyecto: new FormControl('', Validators.required),
      reservado: new FormControl(''),
      usuarioDestino: this.controlUsuario,
      usuarioDestinoCc: this.controlUsuarioCc,
      referencia: this.controlReferencia
    });
  }
  cargarDetalleExpediente(id: number) {
    this.expedienteService.getExpedienteDetalle(id).subscribe({
      next: (data) => {
        this.expediente = data.expediente;
        this.documentosExistentes = data.documentos.map((doc: any) => ({
          id: doc.id,
          nombreArchivo: doc.nombreArchivo,
          tipoDocumento: doc.tipoDocumento,
          rutaArchivo: doc.rutaArchivo,
          tamaño: doc.tamaño,
          visibleParaExternos: doc.visibleParaExternos,
        }));
      },
      error: (err) => {
        console.error('Error al cargar detalle del expediente:', err);
      },
    });
    this.cargarAuditoria();
  }
  abrirDialogoCargo(): void {
    setTimeout(() => (document.activeElement as HTMLElement)?.blur(), 10);
    const expedienteId = this.expediente?.id;
    if (!expedienteId) return;

    const dialogRef = this.dialog.open(DialogoCargoComponent, {
      width: '800px',
      maxWidth: '95vw',
      disableClose: true,
      data: {} // puedes pasar datos si el modal los necesita
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return; // Usuario canceló
      const usuario = this.authService.getUserFromToken();
      const formData = new FormData();
      const now = new Date();
      if (usuario?.id != null) {
        formData.append('usuarioCreadorId', usuario.id.toString());
      } else {
        console.warn('Usuario no disponible o no tiene ID');
      }
      formData.append('expedienteId', expedienteId.toString());
      formData.append('fecha', result.fecha || now.toISOString().split('T')[0]);
      formData.append('hora', result.hora || now.toTimeString().split(' ')[0]);
      if (result.archivo) formData.append('archivo', result.archivo);
      this.loadingService.show();
      this.expedienteService.registrarCargo(formData).subscribe({
        next: (nuevoCargo) => {
          this.loadingService.hide();
          this.expediente.cargo = {
            fecha: nuevoCargo.fecha,
            hora: nuevoCargo.hora,
            codigo: nuevoCargo.codigo,
            archivo: nuevoCargo.archivoPath,
            mensaje: nuevoCargo.mensaje
          };

          this.expedienteService.getHistorialCargos(expedienteId).subscribe(hist => {
            this.historialCargos = hist;
            this.estadoProcesoIndex = 0;

            if (this.expediente?.estado === 'PENDIENTE') {
              const cargoRelacionado = this.historialCargos.length > 0;
              console.log(cargoRelacionado);
              if (cargoRelacionado) {
                this.estadoProcesoIndex = 4; // caso especial: paso 1 y 3 verdes, paso 2 ambar
              } else {
                this.estadoProcesoIndex = 1;
              }
            } else if (this.expediente?.estado === 'APROBADO') {
              const cargoRelacionado = this.historialCargos.length > 0;
              if (cargoRelacionado) {
                this.estadoProcesoIndex = 3;
              } else {
                this.estadoProcesoIndex = 2;
              }
            }
            this.cdr.markForCheck();
          });
          this.auditoriaService.registrarAuditoria({
            usuario: usuario?.id,
            accion: 'CREACION',
            expedienteId: this.expediente?.id,
            cargoId: result.id,
            descripcion: 'Registro de nuevo cargo desde detalle del expediente'
          }).subscribe({
            next: () => console.log('[AUDITORIA] Cargo registrado'),
            error: err => console.error('[AUDITORIA] Error al registrar auditoría de cargo', err)
          });
          this.cargarAuditoria();
          Swal.fire({
            icon: 'success',
            title: 'Cargo generado correctamente',
            allowOutsideClick: false,
            allowEscapeKey: false,
            confirmButtonColor: '#004C77'
          });
        },
        error: (err) => {
          this.loadingService.hide();
          console.error('Error al registrar cargo:', err);
          Swal.fire({
            icon: 'error',
            title: 'No se pudo generar el cargo',
            text: 'Verifica los datos enviados.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            confirmButtonColor: '#F36C21'
          });
        }
      });
    });
  }


  cargarDatosEnFormulario(): void {
    if (!this.expediente) return;

    this.formularioPaso1.patchValue({
      asunto: this.expediente.asunto || '',
      fecha: this.expediente.fecha || '',
      proyecto: this.expediente.proyecto || '',
      comentario: this.expediente.comentario || '',
      reservado: this.expediente.reservado ? 'si' : 'no',
    });

    // Usuarios emisores y destinatarios (nombres o IDs, según cómo manejes)
    const nombresEmisores = this.expediente.usuariosEmisores?.map((u: any) => u.nombre) || [];
    const nombresDestinatarios = this.expediente.usuariosDestinatarios?.map((u: any) => u.nombre) || [];
    const referencias = this.expediente.referencias || [];

    this.controlUsuario.setValue(nombresEmisores);
    this.controlUsuarioCc.setValue(nombresDestinatarios);
    this.controlReferencia.setValue(referencias);
  }
  activarModoEdicion() {
    if (this.modoEdicionExpediente) {
      this.cargarDatosEnFormulario();
    } else {
      this.cancelarEdicion();
    }
  }


  // Guardar cambios:
  guardarEdicion() {
    if (this.formularioPaso1.invalid) {
      this.formularioPaso1.markAllAsTouched();
      return;
    }

    const datosActualizar = {
      asunto: this.formularioPaso1.value.asunto,
      fecha: this.formularioPaso1.value.fecha,
      proyecto: this.formularioPaso1.value.proyecto,
      comentario: this.formularioPaso1.value.comentario || '',
      reservado: this.formularioPaso1.value.reservado === 'si',
      usuariosEmisores: this.obtenerIdsPorNombres(this.controlUsuario.value ?? []),
      usuariosDestinatarios: this.obtenerIdsPorNombres(this.controlUsuarioCc.value ?? []),
      referencias: this.controlReferencia.value?.join('|') || '',
    };
    this.loadingService.show();
    this.expedienteService.actualizarExpediente(this.expediente.id, datosActualizar).subscribe({
      next: (resp) => {
        const usuario = this.authService.getUserFromToken();
        this.auditoriaService.registrarAuditoria({
          usuario: usuario?.id,
          accion: 'EDICION',
          expedienteId: this.expediente?.id,
          descripcion: 'Edición de expediente desde vista de detalle'
        }).subscribe({
          next: () => console.log('[AUDITORIA] Edición registrada'),
          error: err => console.error('[AUDITORIA] Error al registrar auditoría de edición', err)
        });

        Swal.fire({
          title: 'Expediente actualizado',
          icon: 'success',
          allowOutsideClick: false,
          allowEscapeKey: false,
          confirmButtonColor: '#004C77'
        });
        this.cargarAuditoria();

        this.cargarDetalleExpediente(this.expediente.id);

        // Desactivar modo edición
        this.modoEdicionExpediente = false;
        this.loadingService.hide();

      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          allowOutsideClick: false,
          allowEscapeKey: false,
          text: 'No se pudo actualizar el expediente',
          icon: 'error'
        });
        this.loadingService.hide();
      }
    });
  }
  reiniciarFiltroTipoTo() {
    this.filtroTipoUsuarioTo = '';
    this.filtrarUsuariosTo();
  }

  reiniciarFiltroTipoCc() {
    this.filtroTipoUsuarioCc = '';
    this.filtrarUsuariosCc();
  }

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
  abrirDialogoAgregarUsuario(nombre: string, destino: 'to' | 'cc' | 'nivel') {
    const dialogRef = this.dialog.open(DocumentoAgregarComponent, {
      width: '800px',
      maxWidth: '95vw',
      height: '585px',
      maxHeight: '90vh',
      data: { modo: 'usuario', nombre, destino }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.cargarUsuarios(); // recarga usuarios si se agregó alguno
    });
  }
  filtrarReferencias(): void {
    const texto = this.searchCtrlReferencia.value?.toLowerCase().trim() || '';
    const seleccionadasSeries = (this.controlReferencia.value || []).filter((v): v is string => !!v);
    this.referenciasFiltradas = this.referenciasOriginales.filter(ref =>
      (!this.filtroTipoReferencia || ref.tipo === this.filtroTipoReferencia) &&
      ((ref.serie?.toLowerCase().includes(texto) || '') ||
        (ref.asunto?.toLowerCase().includes(texto) || ''))
    );
  }

  mostrarGrupo(tipo: string): boolean {
    return true;
  }
  cargarReferencias() {
    this.referenciaService.obtenerReferencias().subscribe({
      next: (referencias) => {
        this.referenciasOriginales = referencias;
        this.referenciasFiltradas = [...referencias]; // inicializa la vista
      },
      error: (err) => {
        console.error('Error al cargar referencias', err);
      }
    });
  }

  obtenerReferenciasPorTipo(tipo: Referencia['tipo']): Referencia[] {
    return this.referenciasFiltradas.filter(r => r.tipo === tipo);
  }
  abrirDialogoAgregarReferencia() {
    const dialogRef = this.dialog.open(ReferenciaAgregarComponent, {
      width: '720px',
    });

    dialogRef.afterClosed().subscribe((nuevaReferencia: Referencia) => {
      if (!nuevaReferencia) return;
      this.referenciasOriginales.push(nuevaReferencia);
      this.controlReferencia.setValue([...(this.controlReferencia.value || []), nuevaReferencia.serie]);
      this.filtrarReferencias();
    });
  }

  cargarUsuarios(): void {
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        this.usuariosInternos = usuarios.filter(u => u.firmante === true);
        console.log("ususarios internos:", this.usuariosInternos);
        this.todosUsuarios = usuarios;
        this.usuariosFiltradosTo = [...this.todosUsuarios];
        this.usuariosFiltradosCc = [...this.todosUsuarios];
      },
      error: (err) => {
        console.error('[ERROR] al cargar usuarios', err);
      }
    });
  }
  cancelarEdicion() {
    this.modoEdicionExpediente = false;
    // Opcional: resetear formulario a datos originales
    this.cargarDatosEnFormulario();
  }

  //DOCUMENTO METODOS:
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
    if (e.dataTransfer?.files) {
      this.cargarArchivos(Array.from(e.dataTransfer.files));
    }
  }

  onMultipleFilesSelected(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      this.cargarArchivos(Array.from(files));
    }
  }

  cargarArchivos(files: File[]) {
    for (const archivo of files) {
      if (archivo.type !== 'application/pdf') continue;

      const nuevo: DocumentoNuevo = {
        nombre: archivo.name,
        archivo,
        cargado: false,
        progreso: 0,
        visibleParaExternos: false,
        tipoDocumento: '',
        esExistente: false
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
    }
  }
  actualizarDocumento(doc: DocumentoExpediente) {
    if (!doc.id) return;

    const payload = {
      tipoDocumento: doc.tipoDocumento,
      visibleParaExternos: doc.visibleParaExternos,
    };

    this.expedienteService.actualizarDocumento(doc.id, payload).subscribe({
      next: () => {
        this.cargarAuditoria();
        Swal.fire('Éxito', 'Documento actualizado correctamente', 'success');
      },
      error: () => {
        Swal.fire('Error', 'No se pudo actualizar el documento', 'error');
      },
    });
  }

  toggleVisibilidadDocumento(doc: DocumentoExpediente) {
    Swal.fire({
      title: '¿Cambiar visibilidad?',
      text: `¿Seguro que quieres cambiar la visibilidad de este documento "${doc.nombreArchivo}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonColor: '#004C77',  // Añadimos la paleta de color
      cancelButtonColor: '#F36C21'
    }).then((result) => {
      if (result.isConfirmed) {
        // Cambiar visibilidad
        if (doc.visibleParaExternos === undefined) doc.visibleParaExternos = false;
        doc.visibleParaExternos = !doc.visibleParaExternos;

        this.actualizarDocumento(doc);
        const usuario = this.authService.getUserFromToken();
        const visibilidad = doc.visibleParaExternos ? 'visible' : 'no visible';
        this.auditoriaService.registrarAuditoria({
          usuario: usuario?.id,
          accion: 'EDICION',
          expedienteId: this.expediente?.id,
          documentoId: doc.id,
          descripcion: `Cambio de visibilidad del documento: ahora ${visibilidad} para externos`
        }).subscribe({
          next: () => console.log('[AUDITORIA] Cambio de visibilidad registrado'),
          error: err => console.error('[AUDITORIA] Error al registrar visibilidad', err)
        });

      }
    });
  }

  eliminarDocumentoExistente(doc: DocumentoExpediente) {
    // Verificar si el documento es válido para eliminar (es decir, tiene un id)
    if (!doc.id) {
      console.log('Documento no tiene ID, no se puede eliminar:', doc);
      return; // Documento sin ID no se puede eliminar
    }

    console.log('Eliminando documento:', doc);

    // Mostrar alerta de confirmación
    Swal.fire({
      title: 'Confirmar eliminación',
      text: `¿Seguro que quieres eliminar el documento "${doc.nombreArchivo}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonColor: '#004C77',
      cancelButtonColor: '#F36C21'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Confirmación recibida, eliminando documento con ID:', doc.id);

        this.expedienteService.eliminarDocumento(doc.id!).subscribe({
          next: () => {

            console.log('Eliminación exitosa del documento en backend');
            // Actualizar los documentos locales en el frontend para reflejar la eliminación
            const usuario = this.authService.getUserFromToken();
            this.auditoriaService.registrarAuditoria({
              usuario: usuario?.id,
              accion: 'ELIMINACION',
              expedienteId: this.expediente?.id,
              documentoId: doc.id,
              descripcion: `Eliminación de documento "${doc.nombreArchivo}"`
            }).subscribe({
              next: () => console.log('[AUDITORIA] Documento eliminado'),
              error: err => console.error('[AUDITORIA] Error al registrar eliminación', err)
            });
            this.cargarAuditoria();

            this.documentosExistentes = this.documentosExistentes.filter(d => d.id !== doc.id);
            console.log('Documentos restantes después de la eliminación:', this.documentosExistentes);

            Swal.fire('Eliminado', 'Documento eliminado correctamente', 'success');
          },
          error: (err) => {
            console.error('Error al eliminar documento:', err);
            Swal.fire('Error', 'No se pudo eliminar el documento', 'error');
          }
        });
        this.recargarDocumentosExistentes();

      } else {
        console.log('Eliminación cancelada');
      }
    });
  }

  subirDocumentosAdicionales() {
    const expedienteId = this.expediente?.id;
    if (!expedienteId) {
      console.error('ID de expediente no definido');
      return;
    }
    this.loadingService.show();

    const uploads = this.documentosNuevos.
      map(doc => {
        if (!('archivo' in doc) || !doc.archivo) throw new Error('Documento sin archivo');

        const formData = new FormData();
        formData.append('file', doc.archivo);
        formData.append('tipoDocumento', doc.tipoDocumento || '');
        formData.append('visibleParaExternos', String(doc.visibleParaExternos ?? false));
        formData.append('tamaño', doc.archivo.size.toString());

        console.log('Subiendo documento:', doc.nombre, 'tipo:', doc.tipoDocumento, 'visible:', doc.visibleParaExternos);
        return this.expedienteService.registrarDocumento(expedienteId, formData);
      });

    forkJoin(uploads).subscribe({
      next: (docsSubidos: any[]) => {
        const usuario = this.authService.getUserFromToken();
        docsSubidos.forEach(doc => {
          this.auditoriaService.registrarAuditoria({
            usuario: usuario?.id,
            accion: 'CREACION',
            expedienteId: expedienteId,
            documentoId: doc.id,
            descripcion: `Carga adicional del documento "${doc.nombreArchivo}"`
          }).subscribe({
            next: () => console.log('[AUDITORIA] Documento adicional registrado'),
            error: err => console.error('[AUDITORIA] Error en auditoría de documento adicional', err)
          });
        });
        this.cargarAuditoria();
        Swal.fire({
          title: 'Documentos añadidos',
          text: 'Se cargaron correctamente los documentos adicionales.',
          icon: 'success',
          allowOutsideClick: false,
          allowEscapeKey: false,
          confirmButtonColor: '#004C77'
        });
        this.loadingService.hide();
        this.documentosNuevos = [];
        this.recargarDocumentosExistentes();
      },
      error: () => {
        this.loadingService.hide();
        Swal.fire('Error', 'No se pudieron subir todos los documentos.', 'error');
      }
    });

  }

  recargarDocumentosExistentes(): void {
    if (!this.expediente?.id) return;

    this.expedienteService.getExpedienteDetalle(this.expediente.id).subscribe({
      next: (data) => {
        const nuevosDocumentos: DocumentoExpediente[] = data.documentos.map((doc: any) => ({
          id: doc.id,
          nombreArchivo: doc.nombreArchivo,
          tipoDocumento: doc.tipoDocumento,
          rutaArchivo: doc.rutaArchivo,
          tamaño: doc.tamaño,
          visibleParaExternos: doc.visibleParaExternos,
          esExistente: true
        }));

        // Usa NgZone para asegurarte de estar dentro del ciclo Angular
        this.zone.run(() => {
          this.documentosExistentes = [...nuevosDocumentos];
          this.expediente = {
            ...this.expediente,
            documentos: [...nuevosDocumentos]
          };
          this.cdr.markForCheck(); // 🔁 Dispara verificación de cambio con OnPush
        });
      },
      error: (error) => {
        console.error('Error al cargar documentos:', error);
      }
    });
  }
  irARegistroExpediente(): void {
    this.router.navigate(['/registro-expediente']);
  }

  confirmarCambioTipoDocumento(doc: DocumentoExpediente) {
    Swal.fire({
      title: '¿Confirmar cambio de tipo?',
      text: `¿Seguro que quieres cambiar el tipo de documento a "${doc.tipoDocumento}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      allowOutsideClick: false,
      allowEscapeKey: false,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#004C77',  // Añadimos la paleta de color
      cancelButtonColor: '#F36C21'   // Añadimos la paleta de color
    }).then((result) => {
      if (result.isConfirmed) {
        // Llamar al método para actualizar el tipo de documento en el backend
        this.actualizarDocumento(doc);
        const usuario = this.authService.getUserFromToken();
        this.auditoriaService.registrarAuditoria({
          usuario: usuario?.id,
          accion: 'EDICION',
          expedienteId: this.expediente?.id,
          documentoId: doc.id,
          descripcion: `Cambio de tipo de documento a "${doc.tipoDocumento}"`
        }).subscribe({
          next: () => console.log('[AUDITORIA] Cambio de tipo registrado'),
          error: err => console.error('[AUDITORIA] Error en auditoría de tipo de documento', err)
        });

      } else {
        // Si no se confirma, revertimos el cambio
        doc.tipoDocumento = '';  // O el valor anterior, si es necesario
      }
    });
  }

  verDocumentoExistente(index: number) {
    const doc = this.documentosExistentes[index];
    if (doc.rutaArchivo) {
      window.open(doc.rutaArchivo, '_blank');
    }
  }

  verDocumentoNuevo(index: number) {
    const doc = this.documentosNuevos[index];
    if (doc.archivo) {
      const url = URL.createObjectURL(doc.archivo);
      window.open(url, '_blank');
    }
  }



  eliminarDocumento(index: number) {
    this.documentosNuevos.splice(index, 1);
  }


  alternarVisibilidad(index: number) {
    this.documentosNuevos[index].visibleParaExternos = !this.documentosNuevos[index].visibleParaExternos;
  }

  formatearPeso(bytes: number): string {
    if (!bytes) return 'No especificado';
    return bytes >= 1024 * 1024
      ? (bytes / (1024 * 1024)).toFixed(1) + ' MB'
      : (bytes / 1024).toFixed(0) + ' KB';
  }


  todosLosDocumentosTienenTipo(): boolean {
    return this.documentosNuevos.every(d => d.tipoDocumento && d.tipoDocumento.trim() !== '');
  }

}
