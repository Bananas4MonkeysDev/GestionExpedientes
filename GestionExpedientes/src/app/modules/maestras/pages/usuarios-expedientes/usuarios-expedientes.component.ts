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
import { UsuarioService, Usuario } from '../../../../core/services/usuario.service';
import { MatDialog } from '@angular/material/dialog';
import { DocumentoAgregarComponent } from '../../../expedientes/modal/documento-agregar/documento-agregar.component';
import Swal from 'sweetalert2';



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
  dataSource = new MatTableDataSource<any>(); // usamos `any` para mapear estructura personalizada
  selection = new SelectionModel<any>(true, []);

  aplicarFiltroGlobal(event: Event): void {
    const filtro = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filtro;
  }
  constructor(private dialog: MatDialog, private usuarioService: UsuarioService) { }

  getValor(data: Usuario, columna: string): string {
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
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        console.log(usuarios);
        this.dataSource.data = usuarios;
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
      }
    });
  }



  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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

    Swal.fire({
      title: `¿Eliminar ${seleccionados.length} usuario(s)?`,
      text: 'No podrás revertir esta acción.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const eliminaciones = seleccionados.map(usuario =>
          this.usuarioService.eliminarUsuario(usuario.id).toPromise()
        );

        Promise.all(eliminaciones)
          .then(() => {
            const idsEliminados = seleccionados.map(u => u.id);
            this.dataSource.data = this.dataSource.data.filter(u => !idsEliminados.includes(u.id));
            this.selection.clear();
            Swal.fire('Eliminados', 'Los usuarios seleccionados fueron eliminados.', 'success');
          })
          .catch(err => {
            console.error('Error al eliminar usuarios:', err);
            Swal.fire('Error', 'Hubo un problema al eliminar algunos usuarios.', 'error');
          });
      }
    });
  }


  checkboxLabel(row?: Usuario): string {
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

  editarUsuario(usuario: Usuario): void {
    const dialogRef = this.dialog.open(DocumentoAgregarComponent, {
      width: '800px',
      data: {
        modo: 'usuario',
        usuario: usuario
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'guardado') {
        this.ngOnInit(); // recargar usuarios
      }
    });
  }
  eliminarUsuario(usuario: Usuario) {
    Swal.fire({
      title: `¿Eliminar a ${usuario.nombre}?`,
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarioService.eliminarUsuario(usuario.id).subscribe({
          next: () => {
            this.dataSource.data = this.dataSource.data.filter(u => u.id !== usuario.id);
            Swal.fire('Eliminado', 'El usuario ha sido eliminado.', 'success');
          },
          error: (err) => {
            console.error('Error al eliminar usuario:', err);
            Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error');
          }
        });
      }
    });
  }

  verHistorial(usuario: Usuario) { }
  agregarUsuario(): void {
    const dialogRef = this.dialog.open(DocumentoAgregarComponent, {
      width: '800px',
      data: { modo: 'usuario' } // modo = 'usuario' para nuevo
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'guardado') {
        this.ngOnInit(); // recargar usuarios
      }
    });
  }
  verHistorialGlobal() { }
}
