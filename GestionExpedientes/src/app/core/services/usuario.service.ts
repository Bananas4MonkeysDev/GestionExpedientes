import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { AuthService } from './auth.service';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
export interface Usuario {
  id?: any;
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
  // Paso 1: Recuperar clave, enviando el correo
  recuperarClave(correo: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/recuperar-clave`, { correo });
  }

  // Paso 2: Validar el token 
  validarTokenRecuperacion(token: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/restablecer-clave/validar-token/${token}`);
  }

  // Paso 3: Restablecer la clave con el token
  restablecerClave(token: string, nuevaClave: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('nuevaClave', nuevaClave);
    return this.http.post<any>(`${this.apiUrl}/restablecer-clave/${token}`, body.toString(), {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
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

    return this.http.post<Usuario>(`${this.apiUrl}/registrar`, usuario, { headers });
  }
  verificarCorreoExistente(correo: string): Observable<boolean> {
    const headers = this.getAuthHeaders();
    return this.http.get<boolean>(`${this.apiUrl}/check-correo?correo=${correo}`, { headers });
  }


  // Validador asincrónico para correo
  validarCorreoAsync(usuarioService: UsuarioService) {
    return (control: AbstractControl) => {
      return control.value ? usuarioService.verificarCorreoExistente(control.value).pipe(
        map(isExist => (isExist ? { correoExistente: true } : null))
      ) : null;
    };
  }
validarDniAsync(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const dni = control.value;
    if (!dni) return of(null);

    return this.verificarDniExistente(dni).pipe(
      map(existe => (existe ? { dniExistente: true } : null)),
      catchError(() => of(null))
    );
  };
}

verificarDniExistente(dni: string): Observable<boolean> {
  const headers = this.getAuthHeaders();
  return this.http.get<boolean>(`${this.apiUrl}/existe-dni`, {
    headers,
    params: { dni }
  });
}


  obtenerUsuariosPorIds(ids: string[]): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.post<any[]>(`${this.apiUrl}/por-ids`, ids, { headers });
  }

}
