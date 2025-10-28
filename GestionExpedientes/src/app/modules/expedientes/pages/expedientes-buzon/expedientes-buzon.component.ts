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
import { getSwalOptions } from '../../../../shared/helpers/swal-options.helper';
import { trigger, transition, style, animate } from '@angular/animations';
import { UsuarioService } from '../../../../core/services/usuario.service';

@Component({
  selector: 'app-expedientes-buzon',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [style({ opacity: 0 }), animate('150ms ease-in', style({ opacity: 1 }))]),
      transition(':leave', [animate('150ms ease-out', style({ opacity: 0 }))]),
    ]),
  ],
  standalone: true,
  imports: [CommonModule, MatIcon, MatTooltip, FormsModule],
  templateUrl: './expedientes-buzon.component.html',
  styleUrl: './expedientes-buzon.component.css'
})
export class ExpedientesBuzonComponent implements OnInit {
  filtroActivo = 'recientes';
  cargandoDetalle = false;
  filtroTipo: 'todos' | 'Receptor' | 'Emisor' = 'todos';
  documentosFirmables: any[] = [];
  tabActivo = 'firmas';
  esAdmin = false;
  usuarios: any[] = [];
  expedienteSeleccionado: any = null;
  documentosExistentes: any[] = [];
  proyectos: any[] = [];
  nombreProyectoSeleccionado: string = '';
  historialCargos: any[] = [];
  fechaLimite: string | null = null;
  estadoRegistrado: boolean = false;
  nuevoComentario: string = '';
  nivelesFirmaGeneral: any[] = [];
  nivelesFirmaPorDocumento: any[] = [];
  modoFlujoFirma: 'general' | 'individual' = 'general';
  constructor(private usuarioService: UsuarioService, private loadingService: LoadingOverlayService, private route: ActivatedRoute, private router: Router, private authService: AuthService, private expedienteService: ExpedienteService, private proyectoService: ProyectoService,
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
    this.usuarioService.obtenerUsuarios().subscribe({
      next: usuarios => {
        this.usuarios = usuarios.map(user => ({
          ...user,
          tipoUsuario: user.tipoUsuario?.toUpperCase() || '',
          tipoIdentidad: user.tipoIdentidad?.toUpperCase() || '',
        }));
        console.log('Usuarios cargados (buzón):', this.usuarios);
      },
      error: err => console.error('[ERROR] Cargando usuarios:', err)
    });

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
          ...getSwalOptions('success'),
          title: '¡Documento firmado!',
          text: 'Tu firma ha sido añadida correctamente.'
        });
        this.verDetalle(this.expedienteSeleccionado);
        this.loadingService.hide();

      },
      error: (err) => {
        console.error('[ERROR FIRMA]:', err);
        Swal.fire({
          ...getSwalOptions('error'),
          title: 'Error al firmar',
          text: 'No se pudo firmar el documento. Intenta de nuevo.'
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
    this.tabActivo = 'firmas';
    this.nuevoComentario = '';
    this.fechaLimite = null;
    this.estadoRegistrado = false;
    this.documentosFirmables = [];
    this.nombreProyectoSeleccionado = '';
    this.historialCargos = [];
    this.documentosExistentes = [];
  }

  verDetalle(expediente: any) {
    this.cargandoDetalle = true;
    this.expedienteSeleccionado = null;
    this.resetearSecciones();
    const tipo = expediente.tipoExpediente || expediente.tipo;
    this.tabActivo = tipo === 'Emisor' ? 'firmas' : 'expediente';

    console.log('Expediente seleccionado:', expediente.codigo); if (!expediente.leido) {
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

        // Documentos existentes
        this.documentosExistentes = data.documentos.map((doc: any) => ({
          id: doc.id,
          nombreArchivo: doc.nombreArchivo,
          tipoDocumento: doc.tipoDocumento,
          rutaArchivo: doc.rutaArchivo,
          tamaño: doc.tamaño,
          visibleParaExternos: doc.visibleParaExternos,
          esExistente: true,
        }));

        // Datos del expediente principal
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
              mensaje: data.cargo.mensaje || '',
            }
            : null,
          referencias: data.expediente.referencias
            ? data.expediente.referencias.split('|')
            : [],
          usuariosEmisores: data.usuariosEmisores.map((u: any) => ({
            nombre: u.nombre,
            correo: u.correo,
          })),
          usuariosDestinatarios: data.usuariosDestinatarios.map((u: any) => ({
            nombre: u.nombre,
            correo: u.correo,
          })),
        };

        this.tabActivo =
          this.expedienteSeleccionado.tipo === 'Emisor'
            ? 'firmas'
            : 'expediente';

        // 🔹 Cargar documentos firmables y flujo si es tipo Emisor
        if (this.expedienteSeleccionado.tipo === 'Emisor') {
          const usuario = this.authService.getUserFromToken();

          if (usuario && usuario.id) {
            // --- Documentos firmables ---
            this.expedienteService
              .obtenerDocumentosFirmables(this.expedienteSeleccionado.id, usuario.id)
              .subscribe({
                next: (docs) => {
                  this.documentosFirmables = docs;
                  console.log('Documentos firmables:', docs);
                  this.documentosFirmables.forEach((doc) => {
                    this.verificarSiPuedeFirmar(doc);
                  });

                  // --- Flujo de firmas (solo lectura) ---
                  this.expedienteService
                    .obtenerFlujosPorExpediente(this.expedienteSeleccionado.id)
                    .subscribe({
                      next: (flujos: any[]) => {
                        console.log('Flujos del expediente:', flujos);

                        this.nivelesFirmaGeneral = [];
                        this.nivelesFirmaPorDocumento = [];

                        flujos.forEach((flujo) => {
                          const usuariosIds =
                            flujo.usuarios?.split('|').map((id: string) => parseInt(id)) ||
                            [];
                          const usuariosFirmantesIds =
                            flujo.usuariosFirmantes
                              ?.split('|')
                              .map((id: string) => parseInt(id)) || [];

                          const nivelBase = {
                            nivel: flujo.nivel,
                            estado: flujo.estado,
                            tipoNivel: flujo.tipoNivel,
                            usuarios: usuariosIds, 
                            usuariosFirmantes: usuariosFirmantesIds, // 🔹 también IDs
                          };


                          if (flujo.tipoNivel === 'General') {
                            this.nivelesFirmaGeneral.push(nivelBase);
                          } else {
                            const docId = parseInt(flujo.documentosId);
                            if (!isNaN(docId)) {
                              let flujoDoc =
                                this.nivelesFirmaPorDocumento.find(
                                  (f) => f.documentoId === docId
                                );
                              if (!flujoDoc) {
                                flujoDoc = { documentoId: docId, niveles: [] };
                                this.nivelesFirmaPorDocumento.push(flujoDoc);
                              }
                              flujoDoc.niveles.push(nivelBase);
                            }
                          }
                        });

                        this.nivelesFirmaGeneral.sort((a: any, b: any) => a.nivel - b.nivel);

                        this.nivelesFirmaPorDocumento.forEach((f: any) =>
                          f.niveles.sort((a: any, b: any) => a.nivel - b.nivel)
                        );


                        this.modoFlujoFirma =
                          this.nivelesFirmaGeneral.length > 0
                            ? 'general'
                            : 'individual';

                        console.log('Modo flujo firma:', this.modoFlujoFirma);
                      },
                      error: (err) => {
                        console.error('Error al cargar flujos:', err);
                      },
                    });
                },
                error: (err) => {
                  console.error('Error al cargar documentos firmables', err);
                },
              });
          }
        }

        // 🔹 Lógica adicional de proyecto
        this.proyectoService.getAll().subscribe((data) => {
          this.proyectos = data;
          const proyectoEncontrado = data.find(
            (p) => p.id === Number(this.expedienteSeleccionado.proyecto)
          );
          if (proyectoEncontrado) {
            this.nombreProyectoSeleccionado = proyectoEncontrado.nombre;
          }
        });

        // 🔹 Historial de cargos
        this.expedienteService.getHistorialCargos(id).subscribe((historial) => {
          this.historialCargos = historial;
          if (historial.length > 0) {
            this.expedienteSeleccionado.cargo = {
              ...historial[0],
              archivo: historial[0].archivoPath || '',
            };
          }
        });

        this.cargandoDetalle = false;
      },
      error: (err) => {
        console.error('Error al cargar detalle de expediente', err);
        this.cargandoDetalle = false;
      },
    });
  }

  observarNivel(doc: any) {
    const partes = doc.tipoDocumento.split('|');
    const flujoId = partes[1];
    Swal.fire({
      ...getSwalOptions('question'),
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
            Swal.fire({
              ...getSwalOptions('success'),
              title: 'Observado',
              text: 'Se eliminaron los niveles relacionados.'
            });
            this.verDetalle(this.expedienteSeleccionado);
            this.loadingService.hide();
          },
          error: () => {
            Swal.fire({
              ...getSwalOptions('error'),
              title: 'Error',
              text: 'No se pudo observar el flujo'
            });
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
  get totalFirmadosGeneral(): number {
    return (this.nivelesFirmaGeneral || []).filter((n: any) => n.estado === 'FIRMADO').length;
  }

  get totalNivelesGeneral(): number {
    return (this.nivelesFirmaGeneral || []).length;
  }
  get totalNivelesIndividual(): number {
    return (this.nivelesFirmaPorDocumento || []).reduce((total: number, flujo: any) => {
      return total + (flujo.niveles?.length || 0);
    }, 0);
  }

  obtenerNombreUsuario(id: number): string {
    const usuario = this.usuarios?.find((u: any) => u.id === id);
    return usuario ? usuario.nombre : `Desconocido (#${id})`;
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

    Swal.fire({
      ...getSwalOptions('question'),
      title: '¿Deseas archivar este expediente?',
      text: 'Podrás consultarlo desde la pestaña "Archivados".',
      showCancelButton: true,
      confirmButtonText: 'Sí, archivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.expedienteService.archivarExpediente(exp.id).subscribe(() => {
          exp.archivado = true;
          this.filtrar(this.filtroActivo);

          Swal.fire({
            ...getSwalOptions('success'),
            title: 'Archivado',
            text: 'El expediente fue archivado correctamente.'
          });
        });
      }
    });
  }

  eliminar(event: Event, exp: any) {
    event.stopPropagation();

    Swal.fire({
      ...getSwalOptions('question'),
      title: '¿Deseas eliminar este expediente?',
      text: 'Esta acción lo ocultará de la bandeja.',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.expedienteService.marcarComoDesechado(exp.id).subscribe(() => {
          exp.desechado = true;
          this.expedientes = this.expedientes.filter(e => !e.desechado);
          this.filtrar(this.filtroActivo);

          Swal.fire({
            ...getSwalOptions('success'),
            title: 'Eliminado',
            text: 'El expediente fue eliminado correctamente.'
          });
        });
      }
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
      ...getSwalOptions('question'),
      title: `¿Estás seguro de ${estado === 'APROBADO' ? 'aceptar' : 'rechazar'} este expediente?`,
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
              Swal.fire({
                ...getSwalOptions('success'),
                title: 'Éxito',
                text: 'Expediente actualizado'
              });
            },
            error: (err) => {
              Swal.fire({
                ...getSwalOptions('error'),
                title: 'Error',
                text: 'No se pudo actualizar'
              });
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
      Swal.fire({
        ...getSwalOptions('warning'),
        title: 'Advertencia',
        text: 'El comentario no puede estar vacío'
      });
      return;
    }
    if (!usuario) {
      Swal.fire({
        ...getSwalOptions('error'),
        title: 'Error',
        text: 'No se pudo obtener el usuario actual'
      });
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
        Swal.fire({
          ...getSwalOptions('success'),
          title: 'Comentario guardado',
          text: ''
        });
        this.nuevoComentario = '';
      },
      error: () => {
        Swal.fire({
          ...getSwalOptions('error'),
          title: 'Error',
          text: 'No se pudo guardar el comentario'
        });
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