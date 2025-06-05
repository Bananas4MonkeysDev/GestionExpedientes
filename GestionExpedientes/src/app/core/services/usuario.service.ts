import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { AbstractControl } from '@angular/forms';
export interface Usuario {
  nombre: string;
  correo: string;
  contraseña: string;
  rol: string;
  tipoUsuario: 'INTERNO' | 'EXTERNO';
  tipoIdentidad: 'PERSONA' | 'ENTIDAD';
  ruc?: string;
  dni: string;
}
@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = 'http://localhost:8080/api/usuarios';

  constructor(private http: HttpClient, private authService: AuthService) { }
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }
  obtenerUsuarios(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8080/api/usuarios', {
      headers: this.getAuthHeaders()
    });
  }
  obtenerUsuariosParaExpedientes(): Observable<Usuario[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Usuario[]>(`${this.apiUrl}/expedientes`, { headers });
  }

  login(data: { correo: string, contraseña: string }): Observable<any> {
    return this.http.post('http://localhost:8080/api/auth/login', data);
  }
  registrarUsuario(usuario: Usuario): Observable<Usuario> {
    const token = localStorage.getItem('jwt');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post<Usuario>(`${this.apiUrl}/registrar`, usuario, { headers });
  }
  verificarCorreoExistente(correo: string): Observable<boolean> {
    const headers = this.getAuthHeaders();
    return this.http.get<boolean>(`${this.apiUrl}/check-correo?correo=${correo}`, { headers });
  }

  // Método para verificar si el DNI ya está registrado
  verificarDniExistente(dni: string): Observable<boolean> {
    const headers = this.getAuthHeaders();
    return this.http.get<boolean>(`${this.apiUrl}/check-dni?dni=${dni}`, { headers });
  }
  // Validador asincrónico para correo
  validarCorreoAsync(usuarioService: UsuarioService) {
    return (control: AbstractControl) => {
      return control.value ? usuarioService.verificarCorreoExistente(control.value).pipe(
        map(isExist => (isExist ? { correoExistente: true } : null))
      ) : null;
    };
  }

  // Validador asincrónico para DNI
  validarDniAsync(usuarioService: UsuarioService) {
    return (control: AbstractControl) => {
      return control.value ? usuarioService.verificarDniExistente(control.value).pipe(
        map(isExist => (isExist ? { dniExistente: true } : null))
      ) : null;
    };
  }

}
