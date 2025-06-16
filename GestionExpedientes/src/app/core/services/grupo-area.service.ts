import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { Observable } from 'rxjs';

export interface GrupoArea {
  id?: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  usuariosIds: string;
}

@Injectable({
  providedIn: 'root'
})
export class GrupoAreaService {
  private apiUrl = 'http://localhost:8080/api/grupos-areas';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`
    });
  }

  listar(): Observable<GrupoArea[]> {
    return this.http.get<GrupoArea[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  crear(grupo: GrupoArea): Observable<GrupoArea> {
    return this.http.post<GrupoArea>(this.apiUrl, grupo, { headers: this.getHeaders() });
  }

  actualizar(id: number, grupo: GrupoArea): Observable<GrupoArea> {
    return this.http.put<GrupoArea>(`${this.apiUrl}/${id}`, grupo, { headers: this.getHeaders() });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  obtener(id: number): Observable<GrupoArea> {
    return this.http.get<GrupoArea>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
