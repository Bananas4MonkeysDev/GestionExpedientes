import { Injectable } from '@angular/core';
export interface UsuarioSesion {
  id: number;
  correo: string;
  nombre: string;
  rol: string;
  tipoIdentidad: string;
  tipoUsuario: string;
  dni: string;
  ruc: string;
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  getToken(): string | null {
    return localStorage.getItem('jwt');
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch (e) {
      return true;
    }
  }
  getUserFromToken(): UsuarioSesion | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('[JWT PAYLOAD DECODIFICADO]', payload);

      return {
        id: payload.id,
        correo: payload.correo,
        nombre: payload.nombre,
        rol: payload.rol,
        tipoIdentidad: payload.tipoIdentidad,
        tipoUsuario: payload.tipoUsuario,
        dni: payload.dni,
        ruc: payload.ruc
      };
    } catch (e) {
      console.error('Error al decodificar token JWT', e);
      return null;
    }
  }
  logout(): void {
    localStorage.removeItem('jwt');
  }
  tieneSesionActiva(): boolean {
    const token = localStorage.getItem('jwt');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // `exp` está en segundos, convertimos a milisegundos
      return Date.now() < exp;
    } catch (e) {
      console.error('Token inválido o corrupto:', e);
      return false;
    }
  }
}
