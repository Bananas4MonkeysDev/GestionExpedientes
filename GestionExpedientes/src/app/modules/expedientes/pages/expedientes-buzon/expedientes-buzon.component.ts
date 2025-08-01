import { CommonModule, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { AuthService } from '../../../../core/services/auth.service';
import { ExpedienteService } from '../../../../core/services/expediente.service';
import { ProyectoService } from '../../../../core/services/proyecto.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingOverlayService } from '../../../../core/services/loading-overlay.service';

@Component({
  selector: 'app-expedientes-buzon',
  standalone: true,
  imports: [CommonModule, MatIcon, MatTooltip, FormsModule],
  templateUrl: './expedientes-buzon.component.html',
  styleUrl: './expedientes-buzon.component.css'
})
export class ExpedientesBuzonComponent implements OnInit {
  filtroActivo = 'recientes';
  filtroTipo: 'todos' | 'Receptor' | 'Emisor' = 'todos';
  documentosFirmables: any[] = [];
  tabActivo = 'expediente';

  esAdmin = false;
  expedienteSeleccionado: any = null;
  documentosExistentes: any[] = [];
  proyectos: any[] = [];
  nombreProyectoSeleccionado: string = '';
  historialCargos: any[] = [];
  fechaLimite: string | null = null;
  estadoRegistrado: boolean = false;
  nuevoComentario: string = '';

  constructor(private loadingService: LoadingOverlayService, private route: ActivatedRoute, private router: Router, private authService: AuthService, private expedienteService: ExpedienteService, private proyectoService: ProyectoService,
  ) { }

  ngOnInit(): void {
    const usuario = this.authService.getUserFromToken();
    this.esAdmin = usuario?.tipoUsuario === 'ADMIN';
    if (this.esAdmin) {
      this.expedienteService.obtenerTodosExpedientes().subscribe(data => {
        this.procesarExpedientes(data);
      });
    } else if (usuario?.tipoUsuario === 'INTERNO') {
      console.log("Uusario actual:", usuario);
      const id = usuario.id;
      // Paso 1: Obtener expedientes tipo Receptor (como antes)
      this.expedienteService.obtenerExpedientesPorUsuario(id).subscribe(expedientesReceptor => {
        const soloReceptores = expedientesReceptor.filter(e => e.tipoExpediente === 'Receptor');
        const receptoresFiltrados = soloReceptores.filter(exp => {
          const destinatariosStr = exp.usuariosDestinatarios;

          if (!destinatariosStr || typeof destinatariosStr !== 'string') return false;

          const destinatarioIds = destinatariosStr.split('|').map(id => String(id).trim());

          return destinatarioIds.includes(String(id)); // id es el del usuario actual
        });

        console.log("Expedientes Receptores:", receptoresFiltrados);
        // Paso 2: Obtener expedientes tipo Emisor donde debe firmar
        this.expedienteService.obtenerExpedientesPorFirma(id).subscribe(expedientesEmisor => {
          // Unificamos y eliminamos duplicados por id
          console.log("Expedientes Emisores:", expedientesEmisor);

          const combinados = [...receptoresFiltrados, ...expedientesEmisor];
          const unicos = Array.from(new Map(combinados.map(e => [e.id, e])).values());
          this.procesarExpedientes(unicos);
        });
      });
    }
  }
  expedientes: any[] = [];
  expedientesFiltrados = [...this.expedientes];

  filtrar(tipo: string) {
    this.filtroActivo = tipo;
    this.aplicarFiltros();
  }
  aplicarFiltros() {
    let filtrados = this.expedientes.filter(e => e.estado !== 'ANULADO');

    // Filtro de archivado
    if (this.filtroActivo === 'recientes') {
      filtrados = filtrados.filter(e => !e.archivado);
    } else if (this.filtroActivo === 'archivados') {
      filtrados = filtrados.filter(e => e.archivado);
    }

    // Filtro de tipo expediente
    if (this.filtroTipo !== 'todos') {
      filtrados = filtrados.filter(e => e.tipoExpediente === this.filtroTipo);
    }

    this.expedientesFiltrados = filtrados;
  }

  procesarExpedientes(data: any[]): void {
    this.expedientes = data
      .filter(exp => !exp.desechado)
      .map(exp => ({
        ...exp,
        leido: exp.leido ?? false,
        archivado: exp.archivado ?? false,
        desechado: exp.desechado ?? false
      }));
    this.filtrar(this.filtroActivo);
    const idParam = this.route.snapshot.queryParamMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      const expediente = this.expedientes.find(e => e.id === id);
      if (expediente) {
        console.log('✅ Auto-seleccionando expediente por ID:', id);
        this.verDetalle(expediente);
      } else {
        console.warn('⚠️ El expediente con ID', id, 'no fue encontrado entre los cargados.');
      }
    }
  }

  firmar(doc: any) {
    const usuario = this.authService.getUserFromToken(); // asegúrate de obtener el ID del usuario
    if (!usuario) return;
    const partes = doc.tipoDocumento.split('|');
    const flujoId = partes[1];
    console.log("flujo id del doc firmado:", flujoId);
    this.loadingService.show();

    this.expedienteService.firmarDocumento(flujoId, doc.id, usuario.id).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success',
          title: '¡Documento firmado!',
          text: 'Tu firma ha sido añadida correctamente.',
          confirmButtonColor: '#004C77',
          background: '#f4fdfc',
          color: '#004C77',
          confirmButtonText: 'Aceptar'
        });
        this.verDetalle(this.expedienteSeleccionado);
        this.loadingService.hide();

      },
      error: (err) => {
        console.error('[ERROR FIRMA]:', err); // 👈 Esto es lo que necesitas

        Swal.fire({
          icon: 'error',
          title: 'Error al firmar',
          text: 'No se pudo firmar el documento. Intenta de nuevo.',
          confirmButtonColor: '#F36C21',
          background: '#fff8f2',
          color: '#F36C21',
          confirmButtonText: 'Cerrar'
        });
        this.loadingService.hide();

      }
    });
  }


  formatearPeso(bytes: number): string {
    if (!bytes) return 'No especificado';
    return bytes >= 1024 * 1024
      ? (bytes / (1024 * 1024)).toFixed(1) + ' MB'
      : (bytes / 1024).toFixed(0) + ' KB';
  }
  transformarRutaDocumento(path: string): string | null {
    if (!path) return null;
    const fileName = path.split(/\\|\//).pop();  // Separa por / o \ y toma el último segmento
    return fileName ? `http://localhost:8080/expedientes/${fileName}` : null;
  }
  abrirEnNuevaVentana(url: string) {
    window.open(url, '_blank');
  }
  resetearSecciones() {
    this.tabActivo = 'expediente';
    this.nuevoComentario = '';
    this.fechaLimite = null;
    this.estadoRegistrado = false;
    this.documentosFirmables = [];
    this.nombreProyectoSeleccionado = '';
    this.historialCargos = [];
    this.documentosExistentes = [];
  }

  verDetalle(expediente: any) {
    this.resetearSecciones();
    const id = expediente.id;
    console.log('Expediente seleccionado:', expediente.codigo);
    if (!expediente.leido) {
      this.marcarComoLeido(null, expediente);
    }
    this.obtenerExpediente(expediente);
    console.log('Historial de cargos:', this.historialCargos);
  }
  obtenerExpediente(expediente: any) {
    const id = expediente.id;

    this.expedienteService.getExpedienteDetalle(id).subscribe({
      next: (data) => {
        console.log('📄 Detalle completo recibido del backend:', data);

        this.documentosExistentes = data.documentos.map((doc: any) => ({
          id: doc.id,
          nombreArchivo: doc.nombreArchivo,
          tipoDocumento: doc.tipoDocumento,
          rutaArchivo: doc.rutaArchivo,
          tamaño: doc.tamaño,
          visibleParaExternos: doc.visibleParaExternos,
          esExistente: true,
        }));

        this.expedienteSeleccionado = {
          id: data.expediente.id,
          codigo: data.expediente.codigo,
          tipo: data.expediente.tipoExpediente,
          asunto: data.expediente.asunto,
          fecha: data.expediente.fecha,
          fechaLimiteRespuesta: data.expediente.fechaLimiteRespuesta,
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
          usuariosEmisores: data.usuariosEmisores.map((u: any) => ({
            nombre: u.nombre,
            correo: u.correo
          })),
          usuariosDestinatarios: data.usuariosDestinatarios.map((u: any) => ({
            nombre: u.nombre,
            correo: u.correo
          }))
        };
        // Cargar documentos firmables solo si el expediente es de tipo Emisor
        if (this.expedienteSeleccionado.tipo === 'Emisor') {
          const usuario = this.authService.getUserFromToken();
          if (usuario && usuario.id) {
            this.expedienteService.obtenerDocumentosFirmables(this.expedienteSeleccionado.id, usuario.id).subscribe({
              next: (docs) => {
                this.documentosFirmables = docs;
                console.log('Documentos firmables:', docs);
                this.documentosFirmables.forEach(doc => {
                  this.verificarSiPuedeFirmar(doc);
                });

              },
              error: (err) => {
                console.error('Error al cargar documentos firmables', err);
              }
            });
          }
        }

        console.log('ExpedienteSeleccionado procesado:', this.expedienteSeleccionado);


        // (Opcional) Lógica para nombre del proyecto
        this.proyectoService.getAll().subscribe(data => {
          this.proyectos = data;
          const proyectoEncontrado = data.find(p => p.id === Number(this.expedienteSeleccionado.proyecto));
          if (proyectoEncontrado) {
            this.nombreProyectoSeleccionado = proyectoEncontrado.nombre;
          }
        });
        console.log('Nombre del proyecto:', this.nombreProyectoSeleccionado);

        // (Opcional) Historial de cargos
        this.expedienteService.getHistorialCargos(id).subscribe(historial => {
          this.historialCargos = historial;
          if (historial.length > 0) {
            this.expedienteSeleccionado.cargo = {
              ...historial[0],
              archivo: historial[0].archivoPath || ""
            };
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar detalle de expediente', err);
      }
    });
  }
  observarNivel(doc: any) {
    const partes = doc.tipoDocumento.split('|');
    const flujoId = partes[1];
    Swal.fire({
      title: '¿Deseas observar este nivel?',
      input: 'text',
      inputLabel: 'Motivo de observación',
      inputPlaceholder: 'Escribe un comentario...',
      showCancelButton: true,
      confirmButtonText: 'Observar y eliminar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes ingresar un comentario';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.loadingService.show();
        this.expedienteService.observarNivel(flujoId, result.value).subscribe({
          next: () => {
            Swal.fire('Observado', 'Se eliminaron los niveles relacionados.', 'success');
            this.verDetalle(this.expedienteSeleccionado);
            this.loadingService.hide();
          },
          error: () => {
            Swal.fire('Error', 'No se pudo observar el flujo', 'error');
            this.loadingService.hide();
          }
        });
      }
    });
  }

  verificarSiPuedeFirmar(doc: any): void {
    const usuario = this.authService.getUserFromToken();
    if (!usuario || !doc.tipoDocumento) return;

    const partes = doc.tipoDocumento.split('|');
    const flujoId = partes[1];

    this.expedienteService.verEstadoFirma(flujoId, usuario.id, doc.id).subscribe(res => {
      console.log("respuesta:", res);
      if (res.tipo === 'General') {
        doc.puedeFirmar = !res.docYaFirmado;
      } else {
        doc.puedeFirmar = !res.yaFirmo;
      }

    });
  }


  marcarComoLeido(event: Event | null, exp: any) {
    if (event) event.stopPropagation();
    event?.stopPropagation();
    this.expedienteService.marcarComoLeido(exp.id).subscribe(() => {
      exp.leido = true;
    });
  }

  archivar(event: Event, exp: any) {
    event.stopPropagation();
    this.expedienteService.archivarExpediente(exp.id).subscribe(() => {
      exp.archivado = true;
      this.filtrar(this.filtroActivo);
    });
  }

  eliminar(event: Event, exp: any) {
    event.stopPropagation();
    this.expedienteService.marcarComoDesechado(exp.id).subscribe(() => {
      exp.desechado = true;
      this.expedientes = this.expedientes.filter(e => !e.desechado); // lo remueve visualmente
      this.filtrar(this.filtroActivo);
    });
  }


  aceptarExpediente() {
    if (!this.fechaLimite) return;

    console.log('Fecha límite seleccionada:', this.fechaLimite);
    // Enviar al backend o asociarla al expedienteSeleccionado
  }

  rechazarExpediente() {
    // Lógica para rechazar
    alert(`Expediente ${this.expedienteSeleccionado.codigo} rechazado`);
    this.expedienteSeleccionado = null;
  }
  confirmarAccion(expediente: any, estado: string) {
    Swal.fire({
      title: `¿Estás seguro de ${estado === 'APROBADO' ? 'aceptar' : 'rechazar'} este expediente?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const fechaLimite = estado === 'APROBADO' ? expediente.fechaSeleccionada : null;

        this.expedienteService
          .cambiarEstadoExpedienteConFecha(expediente.id, estado, fechaLimite)
          .subscribe({
            next: (res) => {
              expediente.estado = estado;
              expediente.fechaLimiteRespuesta = fechaLimite;
              Swal.fire('Éxito', 'Expediente actualizado', 'success');
            },
            error: (err) => {
              Swal.fire('Error', 'No se pudo actualizar', 'error');
              console.error('Error al actualizar estado:', err);
            }
          });
      }
    });
  }
  irARegistroExpedienteEmisor(expediente: any) {
    this.router.navigate(['registro-expediente'], {
      queryParams: { responderA: expediente.id, tipo: 'Emisor' }
    });
    console.log('Redirigir a registro emisor con ID:', expediente.id);
  }

  actualizarEstadoExpediente(estado: string, fechaLimite?: string | null) {
    if (!this.expedienteSeleccionado) return;

    this.expedienteService
      .cambiarEstadoExpedienteConFecha(this.expedienteSeleccionado.id, estado, fechaLimite)
      .subscribe(
        () => {
          this.estadoRegistrado = true;
          Swal.fire({
            icon: 'success',
            title: `Expediente ${estado === 'APROBADO' ? 'aceptado' : 'rechazado'} correctamente`,
            timer: 1500,
            showConfirmButton: false
          });
        },
        (error) => {
          console.error('Error al actualizar estado:', error);
          Swal.fire('Error', 'No se pudo actualizar el estado del expediente.', 'error');
        }
      );
  }
  guardarComentario() {
    const usuario = this.authService.getUserFromToken();
    if (!this.nuevoComentario.trim()) {
      Swal.fire('Advertencia', 'El comentario no puede estar vacío', 'warning');
      return;
    }
    if (!usuario) {
      Swal.fire('Error', 'No se pudo obtener el usuario actual', 'error');
      return;
    }

    const comentarioData = {
      expedienteId: this.expedienteSeleccionado.id,
      usuarioId: usuario.id,
      comentario: this.nuevoComentario,
      fechaHora: new Date().toISOString()
    };

    this.expedienteService.registrarComentario(comentarioData).subscribe({
      next: () => {
        Swal.fire('Comentario guardado', '', 'success');
        this.nuevoComentario = '';
      },
      error: () => {
        Swal.fire('Error', 'No se pudo guardar el comentario', 'error');
      }
    });
  }
  actualizarFechaLimite() {
    const nuevaFecha = this.expedienteSeleccionado.fechaSeleccionada;
    this.actualizarEstadoExpediente(this.expedienteSeleccionado.estado, nuevaFecha);
  }

  abrirDetalle(expediente: any) {
    this.router.navigate(['/detalle-expediente', expediente.id]);
  }
}