import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator } from '@angular/material/paginator';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { ChartConfiguration, ChartType } from 'chart.js';
import { ExpedienteService } from '../../../../core/services/expediente.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatTooltip, MatIcon, MatPaginator, MatTable, MatTableModule, MatTabsModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements AfterViewInit, OnInit {
  totalExpedientes = 0;
  totalPendientes = 0;
  totalAprobados = 0;
  totalRechazados = 0;
  totalAnulados = 0;
  displayedColumnsExpedientes = [
    'codigo', 'asunto', 'proyecto', 'fecha',
    'tipoExpediente', 'estado', 'comentario', 'referencias',
    'reservado', 'emisoresNombres', 'destinatariosNombres', 'acciones'
  ];

  displayedColumnsCargos = ['codigoCargo', 'fecha', 'hora', 'expediente', 'acciones'];
  displayedColumnsDocumentos = ['nombre', 'peso', 'expediente', 'acciones'];

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: false } }
  };

  barChartLabels: string[] = ['Expedientes Emisor', 'Receptor'];
  barChartData = [{ data: [0, 0], label: 'Cantidad' }];
  barChartType: ChartType = 'bar';

  expedientes: any[] = [];
  cargos: any[] = [];
  documentos: any[] = [];

  dataSourceExpedientes = new MatTableDataSource(this.expedientes);
  dataSourceCargos = new MatTableDataSource(this.cargos);
  dataSourceDocumentos = new MatTableDataSource(this.documentos);
  filtroCampo: string = '';
  filtroTexto: string = '';
  filtroTipo: string = '';
  filtroReservado: string = '';

  expedientesFiltrados: any[] = [];

  aplicarFiltros(): void {
    this.expedientesFiltrados = this.expedientes.filter(exp => {
      const texto = this.filtroTexto.toLowerCase();
      const coincideTexto = this.filtroCampo
        ? (exp[this.filtroCampo] || '').toLowerCase().includes(texto)
        : true;

      const coincideTipo = this.filtroTipo
        ? exp.tipoExpediente === this.filtroTipo
        : true;

      const coincideReservado = this.filtroReservado !== ''
        ? String(exp.reservado) === this.filtroReservado
        : true;

      return coincideTexto && coincideTipo && coincideReservado;
    });

    this.dataSourceExpedientes.data = this.expedientesFiltrados;
    if (this.paginatorExpedientes) {
      this.paginatorExpedientes.firstPage();
    }

  }
  limpiarFiltros(): void {
    this.filtroCampo = '';
    this.filtroTexto = '';
    this.filtroTipo = '';
    this.filtroReservado = '';
    this.aplicarFiltros();
  }

  onCambioCampoBusqueda(): void {
    this.filtroTexto = '';
    this.filtroTipo = '';
    this.filtroReservado = '';
    this.aplicarFiltros();
  }

  @ViewChild('paginatorExpedientes', { static: false }) paginatorExpedientes!: MatPaginator;
  @ViewChild('paginatorCargos', { static: false }) paginatorCargos!: MatPaginator;
  @ViewChild('paginatorDocumentos', { static: false }) paginatorDocumentos!: MatPaginator;

  constructor(
    private router: Router,
    private expedienteService: ExpedienteService,
    private authService: AuthService,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit(): void {
    const usuario = this.authService.getUserFromToken();
    if (usuario?.tipoUsuario === 'ADMIN') {
      this.expedienteService.obtenerTodosExpedientes().subscribe(data => {
        this.procesarExpedientes(data);
      });
    } else if (usuario) {
      this.expedienteService.obtenerExpedientesPorUsuario(usuario.id).subscribe(data => {
        this.procesarExpedientes(data);
      });
    }
  }

  procesarExpedientes(expedientes: any[]): void {
    this.expedientes = expedientes;
    this.totalExpedientes = expedientes.length;
    this.totalPendientes = expedientes.filter(e => e.estado === 'PENDIENTE').length;
    this.totalAprobados = expedientes.filter(e => e.estado === 'APROBADO').length;
    this.totalRechazados = expedientes.filter(e => e.estado === 'RECHAZADO').length;
    this.totalAnulados = expedientes.filter(e => e.estado === 'ANULADO').length;
    const allIds = new Set<string>();
    expedientes.forEach(exp => {
      (exp.usuariosEmisores || '').split('|').forEach((id: string) => allIds.add(id));
      (exp.usuariosDestinatarios || '').split('|').forEach((id: string) => allIds.add(id));
    });


    const idsList = Array.from(allIds).filter(Boolean);

    if (idsList.length === 0) {
      this.dataSourceExpedientes.data = expedientes;
      return;
    }

    this.usuarioService.obtenerUsuariosPorIds(idsList).subscribe(usuarios => {
      const mapaNombres: Record<string, string> = {};
      usuarios.forEach(u => mapaNombres[u.id] = u.nombre);

      this.expedientes = expedientes.map(exp => ({
        ...exp,
        emisoresNombres: (exp.usuariosEmisores || '').split('|').map((id: string) => mapaNombres[id] || `#${id}`).join(', '),
        destinatariosNombres: (exp.usuariosDestinatarios || '').split('|').map((id: string) => mapaNombres[id] || `#${id}`).join(', ')
      }));
      this.aplicarFiltros();
      this.dataSourceExpedientes.data = this.expedientes;
      this.barChartData[0].data = [
        this.expedientes.filter(e => e.tipoExpediente === 'Emisor').length,
        this.expedientes.filter(e => e.tipoExpediente === 'Receptor').length
      ];
    });
  }

  ngAfterViewInit() {
    this.dataSourceExpedientes.paginator = this.paginatorExpedientes;
    this.dataSourceCargos.paginator = this.paginatorCargos;
    this.dataSourceDocumentos.paginator = this.paginatorDocumentos;
  }

  abrirDetalle(expediente: any) {
    this.router.navigate(['/detalle-expediente', expediente.id]);
  }
}