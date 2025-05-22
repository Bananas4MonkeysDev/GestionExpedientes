import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

  toggleSubmenuExpedientes(): void {
    this.submenuAbierto = !this.submenuAbierto;
  }
  constructor(private router: Router) { }

  logout(): void {
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
    this.router.navigate(['/home']);
  }

  irA(ruta: string): void {
    this.router.navigate([`/${ruta}`]);
  }
}
