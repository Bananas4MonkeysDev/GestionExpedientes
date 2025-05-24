import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

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
  templateUrl: './usuarios-expedientes.component.html',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  styleUrls: ['./usuarios-expedientes.component.css']
})
export class UsuariosExpedientesComponent implements OnInit {
  usuarios: UsuarioExpediente[] = [
    {
      nombre: 'Juan Pérez',
      correo: 'juan.perez@gmail.com',
      telefono: '987654321',
      tipo: 'Persona',
      origen: 'Emisor'
    },
    {
      nombre: 'Contabilidad SAC',
      correo: 'conta@construnet.com',
      telefono: '901234567',
      tipo: 'Entidad',
      ruc: '20123456789',
      origen: 'Destinatario'
    },
    {
      nombre: 'Ana Torres',
      correo: 'ana.torres@gmail.com',
      telefono: '945678123',
      tipo: 'Persona',
      origen: 'Emisor'
    },
    {
      nombre: 'Luis Cruzado',
      correo: 'luis.cruzado@gmail.com',
      telefono: '945678123',
      tipo: 'Persona',
      origen: 'Emisor'
    }
  ];
  ngOnInit() {
  }
  verHistorialGlobal() {
    console.log('Ver historial general de usuarios');
    // Aquí podrías abrir un modal, navegar a otra vista o mostrar un panel
  }

  editarUsuario(index: number) {
    console.log('Editar:', this.usuarios[index]);
  }

  eliminarUsuario(index: number) {
    this.usuarios.splice(index, 1);
  }

  verHistorial(index: number) {
    console.log('Historial de:', this.usuarios[index]);
  }

  agregarUsuario() {
    console.log('Agregar usuario');
  }
}
