import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

interface UsuarioExpediente {
  nombre: string;
  correo: string;
  telefono: string;
  tipo: 'Persona' | 'Entidad';
  ruc?: string;
  origen: 'Emisor' | 'Destinatario';
}

@Component({
  selector: 'app-usuarios-expedientes',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatTooltipModule,
    MatInputModule,
    MatCheckboxModule,
    CommonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    ReactiveFormsModule, FormsModule],
  templateUrl: './usuarios-expedientes.component.html',
  styleUrls: ['./usuarios-expedientes.component.css']
})
export class UsuariosExpedientesComponent implements OnInit {
  columnas: string[] = ['select', 'nombre', 'correo', 'telefono', 'tipo', 'ruc', 'origen', 'acciones'];
  dataSource = new MatTableDataSource<UsuarioExpediente>();
  selection = new SelectionModel<UsuarioExpediente>(true, []);

  aplicarFiltroGlobal(event: Event): void {
    const filtro = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filtro;
  }
  getValor(data: UsuarioExpediente, columna: string): string {
    return (data as any)[columna] ?? '';
  }

  aplicarFiltroColumna(event: Event, columna: string): void {
    const valor = (event.target as HTMLInputElement).value.trim().toLowerCase();

    this.dataSource.filterPredicate = (data, filter) => {
      return this.getValor(data, columna).toLowerCase().includes(filter);
    };



    this.dataSource.filter = valor;
  }

  limpiarFiltros(): void {
    this.dataSource.filter = '';
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => input.value = '');
  }
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.dataSource.data = this.obtenerUsuarios();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  obtenerUsuarios(): UsuarioExpediente[] {
    return [
      { nombre: 'María López', correo: 'm.lopez@juridicosac.com', telefono: '987123456', tipo: 'Entidad', ruc: '20600123456', origen: 'Emisor' },
      { nombre: 'Pedro García', correo: 'p.garcia@correo.com', telefono: '998765432', tipo: 'Persona', origen: 'Destinatario' },
      { nombre: 'Asesoría Legal SRL', correo: 'contacto@asesorialegal.com', telefono: '933456789', tipo: 'Entidad', ruc: '20451234567', origen: 'Emisor' },
      { nombre: 'Laura Méndez', correo: 'laura.mendez@gmail.com', telefono: '955667788', tipo: 'Persona', origen: 'Emisor' },
      { nombre: 'Instituto Técnico del Norte', correo: 'info@itn.edu.pe', telefono: '900112233', tipo: 'Entidad', ruc: '20555678901', origen: 'Destinatario' },
      { nombre: 'Laura Méndez', correo: 'laura.mendez@gmail.com', telefono: '955667788', tipo: 'Persona', origen: 'Emisor' },
      { nombre: 'Instituto Técnico del Norte', correo: 'info@itn.edu.pe', telefono: '900112233', tipo: 'Entidad', ruc: '20555678901', origen: 'Destinatario' },
      { nombre: 'Instituto Técnico del Norte', correo: 'info@itn.edu.pe', telefono: '900112233', tipo: 'Entidad', ruc: '20555678901', origen: 'Destinatario' },
      { nombre: 'Laura Méndez', correo: 'laura.mendez@gmail.com', telefono: '955667788', tipo: 'Persona', origen: 'Emisor' },
      { nombre: 'Instituto Técnico del Norte', correo: 'info@itn.edu.pe', telefono: '900112233', tipo: 'Entidad', ruc: '20555678901', origen: 'Destinatario' },
      { nombre: 'Laura Méndez', correo: 'laura.mendez@gmail.com', telefono: '955667788', tipo: 'Persona', origen: 'Emisor' },
      { nombre: 'Instituto Técnico del Norte', correo: 'info@itn.edu.pe', telefono: '900112233', tipo: 'Entidad', ruc: '20555678901', origen: 'Destinatario' },
      { nombre: 'Laura Méndez', correo: 'laura.mendez@gmail.com', telefono: '955667788', tipo: 'Persona', origen: 'Emisor' },
      { nombre: 'Instituto Técnico del Norte', correo: 'info@itn.edu.pe', telefono: '900112233', tipo: 'Entidad', ruc: '20555678901', origen: 'Destinatario' },
      { nombre: 'Laura Méndez', correo: 'laura.mendez@gmail.com', telefono: '955667788', tipo: 'Persona', origen: 'Emisor' },
      { nombre: 'Instituto Técnico del Norte', correo: 'info@itn.edu.pe', telefono: '900112233', tipo: 'Entidad', ruc: '20555678901', origen: 'Destinatario' },
      { nombre: 'Laura Méndez', correo: 'laura.mendez@gmail.com', telefono: '955667788', tipo: 'Persona', origen: 'Emisor' },
      { nombre: 'Instituto Técnico del Norte', correo: 'info@itn.edu.pe', telefono: '900112233', tipo: 'Entidad', ruc: '20555678901', origen: 'Destinatario' },
      { nombre: 'Laura Méndez', correo: 'laura.mendez@gmail.com', telefono: '955667788', tipo: 'Persona', origen: 'Emisor' },
      { nombre: 'Instituto Técnico del Norte', correo: 'info@itn.edu.pe', telefono: '900112233', tipo: 'Entidad', ruc: '20555678901', origen: 'Destinatario' },
      { nombre: 'Laura Méndez', correo: 'laura.mendez@gmail.com', telefono: '955667788', tipo: 'Persona', origen: 'Emisor' },
      { nombre: 'Instituto Técnico del Norte', correo: 'info@itn.edu.pe', telefono: '900112233', tipo: 'Entidad', ruc: '20555678901', origen: 'Destinatario' },
      { nombre: 'Laura Méndez', correo: 'laura.mendez@gmail.com', telefono: '955667788', tipo: 'Persona', origen: 'Emisor' },
      { nombre: 'Instituto Técnico del Norte', correo: 'info@itn.edu.pe', telefono: '900112233', tipo: 'Entidad', ruc: '20555678901', origen: 'Destinatario' },
      { nombre: 'Laura Méndez', correo: 'laura.mendez@gmail.com', telefono: '955667788', tipo: 'Persona', origen: 'Emisor' },
      { nombre: 'Instituto Técnico del Norte', correo: 'info@itn.edu.pe', telefono: '900112233', tipo: 'Entidad', ruc: '20555678901', origen: 'Destinatario' },
      { nombre: 'Laura Méndez', correo: 'laura.mendez@gmail.com', telefono: '955667788', tipo: 'Persona', origen: 'Emisor' }
    ];
  }

  isAllSelected() {
    return this.selection.selected.length === this.dataSource.data.length;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach(row => this.selection.select(row));
  }
  eliminarSeleccionados(): void {
    const seleccionados = this.selection.selected;
    this.dataSource.data = this.dataSource.data.filter(u => !seleccionados.includes(u));
    this.selection.clear();
  }

  checkboxLabel(row?: UsuarioExpediente): string {
    return !row ? 'select all' : `select row ${row.nombre}`;
  }

  exportarExcel() {
    const worksheet = XLSX.utils.json_to_sheet(this.dataSource.data.map(u => ({
      Nombre: u.nombre,
      Correo: u.correo,
      Teléfono: u.telefono,
      Tipo: u.tipo,
      RUC: u.tipo === 'Entidad' ? u.ruc : '—',
      Origen: u.origen
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');
    XLSX.writeFile(workbook, 'usuarios.xlsx');
  }

  exportarPDF() {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Nombre', 'Correo', 'Teléfono', 'Tipo', 'RUC', 'Origen']],
      body: this.dataSource.data.map(u => [
        u.nombre,
        u.correo,
        u.telefono,
        u.tipo,
        u.tipo === 'Entidad' ? u.ruc || '—' : '—',
        u.origen
      ])
    });
    doc.save('usuarios.pdf');
  }

  editarUsuario(index: number) { }
  eliminarUsuario(index: number) { }
  verHistorial(index: number) { }
  agregarUsuario() { }
  verHistorialGlobal() { }
}
