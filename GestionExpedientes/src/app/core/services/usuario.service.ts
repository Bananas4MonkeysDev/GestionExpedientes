import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
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

  login(data: { correo: string, contraseña: string }): Observable<any> {
    return this.http.post('http://localhost:8080/api/auth/login', data);
  }
  registrarUsuario(usuario: Usuario): Observable<Usuario> {
    const token = localStorage.getItem('jwt');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post<Usuario>(`${this.apiUrl}/registro`, usuario, { headers });
  }

}
