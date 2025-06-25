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

@Component({
  selector: 'app-expedientes-buzon',
  standalone: true,
  imports: [CommonModule, MatIcon, MatTooltip, FormsModule],
  templateUrl: './expedientes-buzon.component.html',
  styleUrl: './expedientes-buzon.component.css'
})
export class ExpedientesBuzonComponent implements OnInit {
  filtroActivo = 'recientes';
  esAdmin = false;
  expedienteSeleccionado: any = null;
  documentosExistentes: any[] = [];
  proyectos: any[] = [];
  nombreProyectoSeleccionado: string = '';
  historialCargos: any[] = [];
  fechaLimite: string | null = null;
  estadoRegistrado: boolean = false;

  constructor(private route: ActivatedRoute, private router: Router, private authService: AuthService, private expedienteService: ExpedienteService, private proyectoService: ProyectoService,
  ) { }

  ngOnInit(): void {
    const usuario = this.authService.getUserFromToken();
    this.esAdmin = usuario?.tipoUsuario === 'ADMIN';
    if (this.esAdmin) {
      this.expedienteService.obtenerTodosExpedientes().subscribe(data => {
        this.procesarExpedientes(data);
      });
    } else if (usuario) {
      this.expedienteService.obtenerExpedientesPorUsuario(usuario.id).subscribe(data => {
        this.procesarExpedientes(data);
      });
    }
  }
  expedientes: any[] = [];
  expedientesFiltrados = [...this.expedientes];

  filtrar(tipo: string) {
    this.filtroActivo = tipo;
    const sinAnulados = this.expedientes.filter(e => e.estado !== 'ANULADO');

    if (tipo === 'recientes') {
      this.expedientesFiltrados = sinAnulados.filter(e => !e.archivado);
    } else if (tipo === 'archivados') {
      this.expedientesFiltrados = sinAnulados.filter(e => e.archivado);
    } else {
      this.expedientesFiltrados = [...sinAnulados];
    }
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

  verDetalle(expediente: any) {
    const id = expediente.id;
    console.log('🟦 Expediente seleccionado:', expediente.codigo);
    this.expedienteSeleccionado = expediente;
    if (!expediente.leido) {
      this.marcarComoLeido(null, expediente);
    }
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
        console.log('📌 ExpedienteSeleccionado procesado:', this.expedienteSeleccionado);


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
    console.log('Historial de cargos:', this.historialCargos);

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
      queryParams: { responderA: expediente.id }
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


}