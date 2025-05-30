import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
interface DocumentoExpediente {
  nombre: string;
  archivo: File;
  cargado: boolean;
  progreso?: number;
  visibleParaExternos?: boolean;
  tipoDocumento?: string;
}
@Component({
  selector: 'app-expediente-detalle',
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
  documentos: DocumentoExpediente[] = [];
  arrastrando = false;
  tiposDocumento = ['Anexos', 'Actas', 'Carta', 'Oficio', 'Contrato', 'Adenda', 'Solicitud de compra', 'Cotizaciones', 'Cuadro Comparativo', 'Orden de Compra', 'Guia', 'Factura', 'Informe', 'Anexo'];

  constructor(private route: ActivatedRoute, private expedienteService: ExpedienteService, private dialog: MatDialog, private usuarioService: UsuarioService, private referenciaService: ReferenciaService) { }
  @ViewChild('slider', { static: false }) sliderRef!: ElementRef;
  reiniciarFiltroTipoReferencia() {
    this.filtroTipoReferencia = '';
    this.filtrarReferencias();
  }
  obtenerUsuariosPorTipo(lista: Usuario[], tipo: Usuario['tipoIdentidad']): Usuario[] {
    return lista.filter(u => u.tipoIdentidad === tipo);
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

        this.expediente = {
          id: data.expediente.id,
          tipo: data.expediente.tipoExpediente,
          asunto: data.expediente.asunto,
          fecha: data.expediente.fecha,
          proyecto: data.expediente.proyecto,
          reservado: data.expediente.reservado,
          comentario: data.expediente.comentario,
          documentos: data.documentos.map((doc: any) => ({
            nombre: doc.nombreArchivo,
            tipo: doc.tipoDocumento,
            url: `${doc.rutaArchivo}`
          })),
          cargo: data.cargo
            ? {
              fecha: data.cargo.fecha,
              hora: data.cargo.hora,
              archivo: `${data.cargo.archivoPath}`
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
      },
      error: (err) => {
        console.error('Error al cargar expediente', err);
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

  abrirDialogoCargo(): void {
    const dialogRef = this.dialog.open(DialogoCargoComponent, {
      data: {
        cargoExistente: this.expediente.cargo || null
      },
      width: '900px', // antes era 700px
      maxWidth: '95vw', // opcional para evitar que se salga de pantallas pequeñas
      disableClose: true // opcional, para que no se cierre por fuera accidentalmente
    });


    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.expediente.cargo = result;
      }
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
        Swal.fire({
          title: 'Expediente actualizado',
          icon: 'success',
          confirmButtonColor: '#004C77'
        });

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

      const nuevo = {
        nombre: archivo.name,
        archivo,
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
  subirDocumentosAdicionales() {
    const expedienteId = this.expediente?.id;
    if (!expedienteId) {
      console.error('Expediente ID no definido');
      return;
    }

    const uploads = this.documentos.map(doc => {
      const formData = new FormData();
      formData.append('file', doc.archivo);
      formData.append('tipoDocumento', doc.tipoDocumento || '');
      formData.append('visibleParaExternos', String(doc.visibleParaExternos ?? false));
      formData.append('tamaño', doc.archivo.size.toString());

      return this.expedienteService.registrarDocumento(expedienteId, formData);
    });

    Promise.all(uploads.map(req => req.toPromise())).then(() => {
      Swal.fire({
        title: 'Documentos añadidos',
        text: 'Se cargaron correctamente los documentos adicionales.',
        icon: 'success',
        confirmButtonColor: '#004C77'
      });
      this.documentos = []; // limpiar buffer
      this.expedienteService.getExpedienteDetalle(expedienteId).subscribe({
        next: (data) => {
          this.expediente.documentos = data.documentos.map((doc: any) => ({
            nombre: doc.nombreArchivo,
            tipo: doc.tipoDocumento,
            url: `${doc.rutaArchivo}`
          }));
        }
      });
    });
  }

  verDocumento(index: number) {
    const url = URL.createObjectURL(this.documentos[index].archivo);
    window.open(url, '_blank');
  }

  eliminarDocumento(index: number) {
    this.documentos.splice(index, 1);
  }

  alternarVisibilidad(index: number) {
    this.documentos[index].visibleParaExternos = !this.documentos[index].visibleParaExternos;
  }

  formatearPeso(bytes: number): string {
    return bytes >= 1024 * 1024
      ? (bytes / (1024 * 1024)).toFixed(1) + ' MB'
      : (bytes / 1024).toFixed(0) + ' KB';
  }

  todosLosDocumentosTienenTipo(): boolean {
    return this.documentos.every(d => d.tipoDocumento && d.tipoDocumento.trim() !== '');
  }

}
