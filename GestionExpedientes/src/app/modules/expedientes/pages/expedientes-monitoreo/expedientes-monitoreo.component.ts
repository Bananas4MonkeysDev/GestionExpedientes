import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-expedientes-monitoreo',
  templateUrl: './expedientes-monitoreo.component.html',
  styleUrls: ['./expedientes-monitoreo.component.css'],
  standalone: true,
  imports: [MatIcon, FormsModule, CommonModule]
})
export class ExpedientesMonitoreoComponent {
  filtro: string = '';
  expedienteSeleccionado: any = null;

  @ViewChild('carrusel') carrusel!: ElementRef<HTMLDivElement>;

  expedientes = [
    {
      numero: 'EXP-2024-054',
      tipo: 'Expediente Receptor',
      fecha: '2024-05-01',
      areaActual: 'Gerencia Legal',
      responsable: 'María Fernández',
      estado: 'EN PROCESO',
      nuevo: true,
      progreso: [
        {
          area: 'Mesa de Partes',
          fecha: '01/05/2024 10:15 a.m.',
          responsable: 'Carlos López',
          descripcion: 'Recepción inicial del expediente.'
        },
        {
          area: 'Secretaría General',
          fecha: '01/05/2024 11:00 a.m.',
          responsable: 'Juana Torres',
          descripcion: 'Registro y derivación al área legal.'
        }
      ]
    },
    {
      numero: 'EXP-2024-055',
      tipo: 'Expediente Emisor',
      fecha: '2024-05-02',
      areaActual: 'Secretaría General',
      responsable: 'Luis Torres',
      estado: 'FINALIZADO',
      nuevo: false,
      progreso: [
        {
          area: 'Mesa de Partes',
          fecha: '02/05/2024 08:00 a.m.',
          responsable: 'Carlos López',
          descripcion: 'Recepción del expediente.'
        },
        {
          area: 'Secretaría General',
          fecha: '02/05/2024 09:00 a.m.',
          responsable: 'Luis Torres',
          descripcion: 'Revisión final y cierre.'
        }
      ]
    }
  ];

  expedientesFiltrados() {
    const f = this.filtro.trim().toLowerCase();
    return this.expedientes.filter(e =>
      e.numero.toLowerCase().includes(f) ||
      e.areaActual.toLowerCase().includes(f) ||
      e.estado.toLowerCase().includes(f)
    );
  }

  seleccionarExpediente(expediente: any) {
    this.expedienteSeleccionado = expediente;
  }
  constructor(private router: Router) { }

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
      confirmButtonText: 'Sí, responder',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        // Redirigir al registro de expediente emisor
        // Puedes guardar el número o ID en localStorage si deseas enviarlo como referencia
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
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Volver'
    }).then(result => {
      if (result.isConfirmed) {
        this.expedienteSeleccionado.estado = 'RECHAZADO';
        Swal.fire({
          title: 'Cancelado',
          text: 'El expediente fue marcado como rechazado.',
          icon: 'success',
          confirmButtonColor: '#004C77'
        });
        this.expedienteSeleccionado = null;
      }
    });
  }
}
