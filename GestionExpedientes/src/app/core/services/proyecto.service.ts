import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface Proyecto {
  id?: number;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
}
@Injectable({ providedIn: 'root' })
export class ProyectoService {
  private url = 'http://localhost:8080/api/proyectos'; // Ajusta si usas otro puerto o path

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getAll(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(this.url, { headers: this.headers() });
  }

  create(proyecto: Proyecto): Observable<Proyecto> {
    return this.http.post<Proyecto>(this.url, proyecto, { headers: this.headers() });
  }

  update(id: number, proyecto: Proyecto): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}`, proyecto, { headers: this.headers() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`, { headers: this.headers() });
  }
}