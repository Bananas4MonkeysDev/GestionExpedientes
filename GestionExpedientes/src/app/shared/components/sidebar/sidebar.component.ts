import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UsuarioSesion } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() isOpen: boolean = true;

  filtro: string = '';
  submenuAbierto: boolean = false;
  submenuMaestras: boolean = false;

  nombreUsuario = '';
  tipoUsuario = '';
  ngOnInit(): void {
    const user: UsuarioSesion | null = this.authService.getUserFromToken();
    if (user) {
      this.nombreUsuario = user.nombre;
      this.tipoUsuario = user.tipoUsuario;
      console.log('[Usuario Sidebar]', user);
    }
  }
  toggleSubmenuExpedientes(): void {
    this.submenuAbierto = !this.submenuAbierto;
  }
  constructor(private router: Router, private authService: AuthService) { }

  logout(): void {
     this.authService.logout();
    this.router.navigate(['/login']);
  }

  irARegistroExpediente(): void {
    this.router.navigate(['/registro-expediente']);
  }

  irAInicio(): void {
    this.router.navigate(['/home']);
  }


  coincideFiltro(texto: string): boolean {
    return texto.toLowerCase().includes(this.filtro.toLowerCase());
  }

  toggleSubmenuMaestras(): void {
    this.submenuMaestras = !this.submenuMaestras;
  }

  irADashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  irA(ruta: string): void {
    this.router.navigate([`/${ruta}`]);
  }
}
