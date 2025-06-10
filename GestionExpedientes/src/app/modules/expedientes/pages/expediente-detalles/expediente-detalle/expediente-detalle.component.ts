import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  nombre: string;
  archivo: File;
  cargado?: boolean;
  progreso?: number;
  visibleParaExternos?: boolean;
  tipoDocumento?: string;
  esExistente: false;
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
  seccion: 'expediente' | 'documentos' | 'cargo' | 'estado' | 'auditoria' = 'expediente';
  expediente: any = null;
  modoEdicionExpediente = false;
  formularioPaso1!: FormGroup;
  controlUsuario = new FormControl<string[]>([], Validators.required);
  controlUsuarioCc = new FormControl<string[]>([], Validators.required);
  controlReferencia = new FormControl<string[]>([], Validators.required);
  todosUsuarios: Usuario[] = [];
  searchCtrlUsuario = new FormControl('');
  searchCtrlCc = new FormControl('');
  searchCtrlReferencia = new FormControl('');
  filtroTipoUsuarioTo = '';
  filtroTipoUsuarioCc = '';
  filtroTipoReferencia = '';
  usuariosFiltradosTo: Usuario[] = [];
  usuariosFiltradosCc: Usuario[] = [];
  referenciasFiltradas: Referencia[] = [];
  referenciasOriginales: Referencia[] = [];
  tiposUsuario: Usuario['tipoIdentidad'][] = ['PERSONA', 'GRUPO', 'ENTIDAD'];
  tiposReferencia: Referencia['tipo'][] = ['Documento', 'Expediente'];
  proyectos = ['Proyecto Alpha', 'Obra Central', 'Planta Nueva', 'Infraestructura Zonal'];
  documentosExistentes: DocumentoExpediente[] = [];
  documentosNuevos: DocumentoNuevo[] = [];
  arrastrando = false;
  tiposDocumento = ['Anexos', 'Actas', 'Carta', 'Oficio', 'Contrato', 'Adenda', 'Solicitud de compra', 'Cotizaciones', 'Cuadro Comparativo', 'Orden de Compra', 'Guia', 'Factura', 'Informe', 'Anexo'];
  historialCargos: any[] = [];
  isLoading = false;
  auditorias: any[] = [];


  constructor(private auditoriaService: AuditoriaService, private authService: AuthService, private loadingService: LoadingOverlayService,
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
  // expediente-detalle.component.ts



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
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
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
        console.log('[DEBUG] Objeto expediente armado:', this.expediente);
        this.cdr.detectChanges();
        this.expedienteService.getHistorialCargos(id).subscribe(historial => {
          console.log('[DEBUG] Historial de cargos:', historial); // ← AÑADIDO
          this.historialCargos = historial;
          this.expediente.cargo = {
            ...historial[0],
            archivo: historial[0].archivoPath
          };
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        console.error('Error al cargar expediente', err);
      }
    });
  }
  onTabChange(tab: 'expediente' | 'documentos' | 'estado' | 'cargo' | 'auditoria'): void {
    this.seccion = tab;
    if (tab === 'auditoria') {
      this.cargarAuditoria();
    }
  }

  cargarAuditoria(): void {
    console.log('[AUDITORÍA] Intentando cargar auditoría...');

    if (!this.expediente) {
      console.warn('[AUDITORÍA] El objeto expediente aún no está cargado.');
      return;
    }

    console.log('[AUDITORÍA] Expediente cargado:', this.expediente);

    if (!this.expediente.id) {
      console.warn('[AUDITORÍA] El expediente no tiene un ID válido.');
      return;
    }

    console.log('[AUDITORÍA] Usando expediente ID:', this.expediente.id);

    this.auditoriaService.getAuditoriasPorExpediente(this.expediente.id).subscribe({
      next: (data) => {
        this.auditorias = data;
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
    Swal.fire({
      title: '¿Anular expediente?',
      text: 'Esta acción no eliminará el expediente, solo cambiará su estado a "ANULADO".',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#004C77',
      cancelButtonColor: '#F36C21',
      confirmButtonText: 'Sí, anular',
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
          },
          error: () => {
            Swal.fire('Error', 'No se pudo anular el expediente', 'error');
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
          confirmButtonColor: '#004C77'
        });
        this.cargarAuditoria();

        // Actualizar localmente datos (opcional)
        Object.assign(this.expediente, datosActualizar);
        this.expediente.referencias = (datosActualizar.referencias || '').split('|');

        // Desactivar modo edición
        this.modoEdicionExpediente = false;
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar el expediente',
          icon: 'error'
        });
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
  abrirDialogoAgregarUsuario(nombre: string, destino: 'to' | 'cc') {
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
  abrirDialogoAgregarReferencia(serie: string) {
    const dialogRef = this.dialog.open(DocumentoAgregarComponent, {
      width: '720px',
      data: { modo: 'referencia', serie }
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
          confirmButtonColor: '#004C77'
        });
        this.documentosNuevos = [];
        this.recargarDocumentosExistentes();
      },
      error: () => {
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

  confirmarCambioTipoDocumento(doc: DocumentoExpediente) {
    Swal.fire({
      title: '¿Confirmar cambio de tipo?',
      text: `¿Seguro que quieres cambiar el tipo de documento a "${doc.tipoDocumento}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
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
