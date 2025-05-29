import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DialogoCargoComponent } from '../../../modal/dialogo-cargo/dialogo-cargo.component'; // Ajusta si tu ruta es distinta
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-expediente-detalle',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './expediente-detalle.component.html',
  styleUrls: ['./expediente-detalle.component.css'],
})
export class ExpedienteDetalleComponent implements OnInit {
  seccion: 'expediente' | 'estado' | 'auditoria' = 'expediente';
  expediente: any = null;

  constructor(private route: ActivatedRoute, private dialog: MatDialog) { }
  @ViewChild('slider', { static: false }) sliderRef!: ElementRef;


  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.expediente = {
      id,
      tipo: 'Receptor',
      asunto: 'Informe Técnico de Equipos',
      fecha: '2025-05-26',
      proyecto: 'Obra Central',
      reservado: true,
      comentario: 'Observaciones adicionales...',
      usuarios: ['Juan Pérez', 'Ana Torres'],
      documentos: [
        { nombre: 'informe.pdf', tipo: 'Informe', url: '#' },
        { nombre: 'informe.pdf', tipo: 'Informe', url: '#' },
        { nombre: 'informe.pdf', tipo: 'Informe', url: '#' },
        { nombre: 'informe.pdf', tipo: 'Informe', url: '#' },
        { nombre: 'informe.pdf', tipo: 'Informe', url: '#' },
        { nombre: 'informe.pdf', tipo: 'Informe', url: '#' },
        { nombre: 'informe.pdf', tipo: 'Informe', url: '#' },
        { nombre: 'informe.pdf', tipo: 'Informe', url: '#' },
        { nombre: 'cotizacion.pdf', tipo: 'Cotización', url: '#' },
      ],
      cargo: {
        fecha: '2025-05-26',
        hora: '16:25',
        archivo: '#'
      },
      estadoProceso: [
        {
          nombre: 'Recibido',
          fecha: '2025-05-26 15:00',
          descripcion: 'El expediente fue recibido por la mesa de partes',
          completado: true
        },
        {
          nombre: 'Cargo Generado',
          fecha: '2025-05-26 16:25',
          descripcion: 'Se generó el cargo del expediente',
          completado: true
        },
        {
          nombre: 'Derivado a Usuario Interno',
          fecha: '2025-05-26 17:00',
          descripcion: 'Asignado al usuario TI para evaluación',
          completado: true
        }
      ],
      auditoria: [
        {
          usuario: 'Ana Torres',
          accion: 'Registro',
          fecha: '2025-05-26',
          instancia: 'Inicio',
          documentos: ['informe.pdf']
        },
        {
          usuario: 'Juan Pérez',
          accion: 'Generación de cargo',
          fecha: '2025-05-26',
          instancia: 'Cargo',
          documentos: ['cargo.pdf']
        }
      ]
    };
  }
  scrollSlider(direction: 'left' | 'right') {
    const slider = this.sliderRef.nativeElement as HTMLElement;
    slider.scrollBy({ left: direction === 'left' ? -250 : 250, behavior: 'smooth' });
  }
  eliminarCargo(): void {
    this.expediente.cargo = null;
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
}
