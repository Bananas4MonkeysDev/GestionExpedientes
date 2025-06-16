import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ExpedienteService } from '../../../../core/services/expediente.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-expedientes-monitoreo',
  templateUrl: './expedientes-monitoreo.component.html',
  styleUrls: ['./expedientes-monitoreo.component.css'],
  standalone: true,
  imports: [MatIcon, FormsModule, CommonModule]
})
export class ExpedientesMonitoreoComponent implements OnInit {
  filtro: string = '';
  expedienteSeleccionado: any = null;
  expedientes: any[] = [];

  @ViewChild('carrusel') carrusel!: ElementRef<HTMLDivElement>;

  constructor(
    private expedienteService: ExpedienteService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const usuario = this.authService.getUserFromToken();

    if (usuario?.tipoUsuario === 'ADMIN') {
      this.expedienteService.obtenerTodosExpedientes().subscribe(data => {
        this.expedientes = data;
      });
    } else if (usuario) {
      this.expedienteService.obtenerExpedientesPorUsuario(usuario.id).subscribe(data => {
        this.expedientes = data;
      });
    }
  }

  expedientesFiltrados(): any[] {
    const f = this.filtro.trim().toLowerCase();
    return this.expedientes.filter(e =>
      (e.numero || '').toLowerCase().includes(f) ||
      (e.areaActual || '').toLowerCase().includes(f) ||
      (e.estado || '').toLowerCase().includes(f)
    );
  }

  seleccionarExpediente(expediente: any) {
    this.expedienteSeleccionado = expediente;
  }

  scrollCarrusel(direction: 'left' | 'right') {
    const scrollAmount = 300;
    if (direction === 'left') {
      this.carrusel.nativeElement.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      this.carrusel.nativeElement.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  responderExpediente() {
    Swal.fire({
      title: '¿Deseas responder este expediente?',
      text: 'Se generará un expediente emisor para la respuesta.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#004C77',
      cancelButtonColor: '#F36C21',
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonText: 'Sí, responder',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.expedienteSeleccionado.estado = 'RESPONDIENDO';
        this.router.navigate(['/registro-expediente'], {
          queryParams: {
            tipo: 'Emisor',
            referencia: this.expedienteSeleccionado.numero
          }
        });
      }
    });
  }

  cancelarExpediente() {
    Swal.fire({
      title: '¿Deseas cancelar este expediente?',
      text: 'Este expediente será marcado como "Rechazado".',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F36C21',
      cancelButtonColor: '#999999',
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Volver'
    }).then(result => {
      if (result.isConfirmed) {
        this.expedienteSeleccionado.estado = 'RECHAZADO';
        Swal.fire({
          title: 'Cancelado',
          text: 'El expediente fue marcado como rechazado.',
          icon: 'success',
          allowOutsideClick: false,
          allowEscapeKey: false,
          confirmButtonColor: '#004C77'
        });
        this.expedienteSeleccionado = null;
      }
    });
  }
  verDetalleExpediente() {
    if (this.expedienteSeleccionado?.id) {
      this.router.navigate(['/detalle-expediente', this.expedienteSeleccionado.id]);
    }
  }

}
