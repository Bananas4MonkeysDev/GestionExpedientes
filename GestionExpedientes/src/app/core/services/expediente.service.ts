// expediente.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExpedienteService {
  private baseUrl = 'http://localhost:8080/api/expedientes';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt');
    console.log('[DEBUG] JWT token:', localStorage.getItem('jwt'));

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }
  actualizarExpediente(id: number, data: any): Observable<any> {
    console.log('[DEBUG] JWT token:', localStorage.getItem('jwt'));

    return this.http.put(`${this.baseUrl}/${id}`, data, {
      headers: this.getHeaders()
    });
  }
  actualizarDocumento(documentoId: number, data: any): Observable<any> {
    console.log('[DEBUG] JWT token:', localStorage.getItem('jwt'));

    return this.http.put(`${this.baseUrl}/documento/${documentoId}`, data, {
      headers: this.getHeaders(),
    });
  }

  eliminarDocumento(documentoId: number): Observable<any> {
    console.log('[DEBUG] JWT token:', localStorage.getItem('jwt'));

    return this.http.delete(`${this.baseUrl}/${documentoId}`, {
      headers: this.getHeaders(),
    });
  }
  getHistorialCargos(expedienteId: number): Observable<any[]> {
    const token = localStorage.getItem('jwt') || '';
    console.log('[DEBUG] JWT token:', localStorage.getItem('jwt'));

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<any[]>(`http://localhost:8080/api/cargos/expediente/${expedienteId}/historial`, { headers });
  }

  registrarExpediente(expediente: any): Observable<any> {
    console.log('[DEBUG] JWT token:', localStorage.getItem('jwt'));
    return this.http.post(`${this.baseUrl}/registrar`, expediente, {
      headers: this.getHeaders()
    });
  }

  registrarDocumento(expedienteId: number, documento: FormData): Observable<any> {
    console.log('[DEBUG] JWT token:', localStorage.getItem('jwt'));

    return this.http.post(`${this.baseUrl}/${expedienteId}/documento`, documento, {
      headers: this.getHeaders()
    });
  }
  notificarExpediente(expedienteId: number): Observable<any> {
    console.log('[DEBUG] JWT token:', localStorage.getItem('jwt'));

    return this.http.post(`${this.baseUrl}/notificar-expediente/${expedienteId}`, {}, {
      headers: this.getHeaders()
    });
  }

  registrarCargo(cargo: FormData): Observable<any> {
    const token = localStorage.getItem('jwt') || '';
    console.log('[DEBUG] JWT token:', localStorage.getItem('jwt'));

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.post(`http://localhost:8080/api/cargos/cargo`, cargo, { headers });
  }
  getExpedienteDetalle(id: number): Observable<any> {
    const token = localStorage.getItem('jwt'); // O de donde guardes el token
    console.log('[DEBUG] JWT token:', localStorage.getItem('jwt'));

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`http://localhost:8080/api/expedientes/${id}/detalle`, { headers });
  }
  obtenerTodosExpedientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}`, {
      headers: this.getHeaders()
    });
  }
  cambiarEstadoExpediente(id: number, nuevoEstado: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/estado/simple?estado=${nuevoEstado}`, {}, {
      headers: this.getHeaders()
    });
  }
  cambiarEstadoExpedienteConFecha(id: number, estado: string, fechaLimite?: string | null): Observable<any> {
    const body: any = { estado };
    if (fechaLimite) body.fechaLimite = fechaLimite;

    return this.http.put(`${this.baseUrl}/${id}/estado`, body, {
      headers: this.getHeaders()
    });
  }


  obtenerExpedientesPorUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/por-usuario/${usuarioId}`, {
      headers: this.getHeaders()
    });
  }
  marcarComoLeido(id: number) {
    return this.http.put(`${this.baseUrl}/${id}/marcar-leido`, {});
  }

  archivarExpediente(id: number) {
    return this.http.put(`${this.baseUrl}/${id}/archivar`, {});
  }
  marcarComoDesechado(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/expedientes/${id}/desechar`, null);
  }

}
