import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-expedientes-monitoreo',
  templateUrl: './expedientes-monitoreo.component.html',
  styleUrls: ['./expedientes-monitoreo.component.css'],
  standalone: true,
  imports:[
    MatIcon,
    FormsModule,
    CommonModule
  ]
})
export class ExpedientesMonitoreoComponent {
  filtro: string = '';
  expedienteSeleccionado: any = null;

  @ViewChild('carrusel') carrusel!: ElementRef<HTMLDivElement>;

  expedientes = [
    {
      numero: 'EXP-2024-054',
      tipo: 'Expediente Emisor',
      fecha: '2024-05-01',
      areaActual: 'Gerencia Legal',
      responsable: 'María Fernández',
      estado: 'EN PROCESO',
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
        },
        {
          area: 'Gerencia Legal',
          fecha: '02/05/2024 09:30 a.m.',
          responsable: 'María Fernández',
          descripcion: 'Revisión en curso del expediente.'
        }
      ]
    },
    {
      numero: 'EXP-2024-055',
      tipo: 'Expediente Receptor',
      fecha: '2024-05-02',
      areaActual: 'Secretaría General',
      responsable: 'Luis Torres',
      estado: 'FINALIZADO',
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
    },
    {
      numero: 'EXP-2024-055',
      tipo: 'Expediente Receptor',
      fecha: '2024-05-02',
      areaActual: 'Secretaría General',
      responsable: 'Luis Torres',
      estado: 'FINALIZADO',
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
    },
    {
      numero: 'EXP-2024-055',
      tipo: 'Expediente Receptor',
      fecha: '2024-05-02',
      areaActual: 'Secretaría General',
      responsable: 'Luis Torres',
      estado: 'FINALIZADO',
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
    },
    {
      numero: 'EXP-2024-055',
      tipo: 'Expediente Receptor',
      fecha: '2024-05-02',
      areaActual: 'Secretaría General',
      responsable: 'Luis Torres',
      estado: 'FINALIZADO',
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
    },
    {
      numero: 'EXP-2024-055',
      tipo: 'Expediente Receptor',
      fecha: '2024-05-02',
      areaActual: 'Secretaría General',
      responsable: 'Luis Torres',
      estado: 'FINALIZADO',
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
    },
    {
      numero: 'EXP-2024-055',
      tipo: 'Expediente Receptor',
      fecha: '2024-05-02',
      areaActual: 'Secretaría General',
      responsable: 'Luis Torres',
      estado: 'FINALIZADO',
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
    },
    {
      numero: 'EXP-2024-055',
      tipo: 'Expediente Receptor',
      fecha: '2024-05-02',
      areaActual: 'Secretaría General',
      responsable: 'Luis Torres',
      estado: 'FINALIZADO',
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
    },
    {
      numero: 'EXP-2024-055',
      tipo: 'Expediente Receptor',
      fecha: '2024-05-02',
      areaActual: 'Secretaría General',
      responsable: 'Luis Torres',
      estado: 'FINALIZADO',
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
    },
    {
      numero: 'EXP-2024-055',
      tipo: 'Expediente Receptor',
      fecha: '2024-05-02',
      areaActual: 'Secretaría General',
      responsable: 'Luis Torres',
      estado: 'FINALIZADO',
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
    },
    {
      numero: 'EXP-2024-056',
      tipo: 'Expediente Emisor',
      fecha: '2024-05-04',
      areaActual: 'Contabilidad',
      responsable: 'Laura Pérez',
      estado: 'OBSERVADO',
      progreso: [
        {
          area: 'Contabilidad',
          fecha: '04/05/2024 12:00 p.m.',
          responsable: 'Laura Pérez',
          descripcion: 'Observaciones pendientes de resolución.'
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

  scrollCarrusel(direction: 'left' | 'right') {
    const scrollAmount = 300;
    if (direction === 'left') {
      this.carrusel.nativeElement.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      this.carrusel.nativeElement.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }
}
