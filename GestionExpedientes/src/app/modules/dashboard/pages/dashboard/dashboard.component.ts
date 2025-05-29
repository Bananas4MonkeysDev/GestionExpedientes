import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator } from '@angular/material/paginator';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIcon, MatPaginator, MatTable, MatTableModule, MatTabsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements AfterViewInit {
  totalExpedientes = 5;
  displayedColumnsExpedientes = ['codigo', 'asunto', 'proyecto', 'fecha', 'tipo', 'reservado', 'acciones'];
  displayedColumnsCargos = ['codigoCargo', 'fecha', 'hora', 'expediente', 'acciones'];
  displayedColumnsDocumentos = ['nombre', 'peso', 'expediente', 'acciones'];
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: false },
    }
  };

  barChartLabels: string[] = ['Expedientes Emisor', 'Receptor'];
  barChartData = [{ data: [4, 6], label: 'Cantidad' }];
  barChartType: ChartType = 'bar';

  expedientes = [
    {
      codigo: 'EXP-T56-7C41',
      asunto: 'Informe Técnico 01',
      proyecto: 'Obra Central',
      fecha: '2025-05-25',
      tipo: 'Receptor',
      reservado: true
    },
    {
      codigo: 'EXP-T56-7C41',
      asunto: 'Informe Técnico 01',
      proyecto: 'Obra Central',
      fecha: '2025-05-25',
      tipo: 'Receptor',
      reservado: true
    },
    {
      codigo: 'EXP-T56-7C41',
      asunto: 'Informe Técnico 01',
      proyecto: 'Obra Central',
      fecha: '2025-05-25',
      tipo: 'Receptor',
      reservado: true
    },
    {
      codigo: 'EXP-T56-7C41',
      asunto: 'Informe Técnico 01',
      proyecto: 'Obra Central',
      fecha: '2025-05-25',
      tipo: 'Receptor',
      reservado: true
    },
    {
      codigo: 'EXP-T56-7C41',
      asunto: 'Informe Técnico 01',
      proyecto: 'Obra Central',
      fecha: '2025-05-25',
      tipo: 'Receptor',
      reservado: true
    },
    {
      codigo: 'EXP-T56-7C41',
      asunto: 'Informe Técnico 01',
      proyecto: 'Obra Central',
      fecha: '2025-05-25',
      tipo: 'Receptor',
      reservado: true
    },
    {
      codigo: 'EXP-T56-7C41',
      asunto: 'Informe Técnico 01',
      proyecto: 'Obra Central',
      fecha: '2025-05-25',
      tipo: 'Receptor',
      reservado: true
    },
    {
      codigo: 'EXP-T56-7C41',
      asunto: 'Informe Técnico 01',
      proyecto: 'Obra Central',
      fecha: '2025-05-25',
      tipo: 'Receptor',
      reservado: true
    },
    {
      codigo: 'EXP-T56-7C41',
      asunto: 'Informe Técnico 01',
      proyecto: 'Obra Central',
      fecha: '2025-05-25',
      tipo: 'Receptor',
      reservado: true
    },
    {
      codigo: 'EXP-PN-03',
      asunto: 'Solicitud Compra',
      proyecto: 'Planta Nueva',
      fecha: '2025-05-24',
      tipo: 'Emisor',
      reservado: false
    }
  ];

  cargos = [
    {
      codigoCargo: 'CARGO-01',
      expediente: 'EXP-T56-7C41',
      fecha: '2025-05-26',
      hora: '16:25',
      archivo: '/assets/pdf/cargo1.pdf'
    },
    {
      codigoCargo: 'CARGO-01',
      expediente: 'EXP-T56-7C41',
      fecha: '2025-05-26',
      hora: '16:25',
      archivo: '/assets/pdf/cargo1.pdf'
    },
    {
      codigoCargo: 'CARGO-01',
      expediente: 'EXP-T56-7C41',
      fecha: '2025-05-26',
      hora: '16:25',
      archivo: '/assets/pdf/cargo1.pdf'
    },
    {
      codigoCargo: 'CARGO-01',
      expediente: 'EXP-T56-7C41',
      fecha: '2025-05-26',
      hora: '16:25',
      archivo: '/assets/pdf/cargo1.pdf'
    },
    {
      codigoCargo: 'CARGO-01',
      expediente: 'EXP-T56-7C41',
      fecha: '2025-05-26',
      hora: '16:25',
      archivo: '/assets/pdf/cargo1.pdf'
    },
    {
      codigoCargo: 'CARGO-01',
      expediente: 'EXP-T56-7C41',
      fecha: '2025-05-26',
      hora: '16:25',
      archivo: '/assets/pdf/cargo1.pdf'
    },
    {
      codigoCargo: 'CARGO-01',
      expediente: 'EXP-T56-7C41',
      fecha: '2025-05-26',
      hora: '16:25',
      archivo: '/assets/pdf/cargo1.pdf'
    },
    {
      codigoCargo: 'CARGO-01',
      expediente: 'EXP-T56-7C41',
      fecha: '2025-05-26',
      hora: '16:25',
      archivo: '/assets/pdf/cargo1.pdf'
    },
    {
      codigoCargo: 'CARGO-01',
      expediente: 'EXP-T56-7C41',
      fecha: '2025-05-26',
      hora: '16:25',
      archivo: '/assets/pdf/cargo1.pdf'
    }
  ];

  documentos = [
    {
      nombre: 'informe.pdf',
      peso: '320 KB',
      expediente: 'EXP-T56-7C41',
      url: '/assets/pdf/informe.pdf'
    },
    {
      nombre: 'informe.pdf',
      peso: '320 KB',
      expediente: 'EXP-T56-7C41',
      url: '/assets/pdf/informe.pdf'
    },
    {
      nombre: 'informe.pdf',
      peso: '320 KB',
      expediente: 'EXP-T56-7C41',
      url: '/assets/pdf/informe.pdf'
    },
    {
      nombre: 'informe.pdf',
      peso: '320 KB',
      expediente: 'EXP-T56-7C41',
      url: '/assets/pdf/informe.pdf'
    },
    {
      nombre: 'informe.pdf',
      peso: '320 KB',
      expediente: 'EXP-T56-7C41',
      url: '/assets/pdf/informe.pdf'
    },
    {
      nombre: 'informe.pdf',
      peso: '320 KB',
      expediente: 'EXP-T56-7C41',
      url: '/assets/pdf/informe.pdf'
    },
    {
      nombre: 'informe.pdf',
      peso: '320 KB',
      expediente: 'EXP-T56-7C41',
      url: '/assets/pdf/informe.pdf'
    },
    {
      nombre: 'informe.pdf',
      peso: '320 KB',
      expediente: 'EXP-T56-7C41',
      url: '/assets/pdf/informe.pdf'
    },
    {
      nombre: 'informe.pdf',
      peso: '320 KB',
      expediente: 'EXP-T56-7C41',
      url: '/assets/pdf/informe.pdf'
    },
    {
      nombre: 'informe.pdf',
      peso: '320 KB',
      expediente: 'EXP-T56-7C41',
      url: '/assets/pdf/informe.pdf'
    },
    {
      nombre: 'cotizacion.pdf',
      peso: '280 KB',
      expediente: 'EXP-PN-03',
      url: '/assets/pdf/cotizacion.pdf'
    }
  ];

  dataSourceExpedientes = new MatTableDataSource(this.expedientes);
  dataSourceCargos = new MatTableDataSource(this.cargos);
  dataSourceDocumentos = new MatTableDataSource(this.documentos);

  @ViewChild('paginatorExpedientes', { static: false }) paginatorExpedientes!: MatPaginator;
  @ViewChild('paginatorCargos', { static: false }) paginatorCargos!: MatPaginator;
  @ViewChild('paginatorDocumentos', { static: false }) paginatorDocumentos!: MatPaginator;

  ngAfterViewInit() {
    this.dataSourceExpedientes.paginator = this.paginatorExpedientes;
    this.dataSourceCargos.paginator = this.paginatorCargos;
    this.dataSourceDocumentos.paginator = this.paginatorDocumentos;
  }


  constructor(private router: Router) { }


  abrirDetalle(expediente: any) {
    this.router.navigate(['/detalle-expediente']);
  }
}