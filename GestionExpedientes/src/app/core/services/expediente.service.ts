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
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }
  actualizarExpediente(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data, {
      headers: this.getHeaders()
    });
  }
  actualizarDocumento(documentoId: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/documento/${documentoId}`, data, {
      headers: this.getHeaders(),
    });
  }

  eliminarDocumento(documentoId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${documentoId}`, {
      headers: this.getHeaders(),
    });
  }
  getHistorialCargos(expedienteId: number): Observable<any[]> {
    const token = localStorage.getItem('jwt') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<any[]>(`http://localhost:8080/api/cargos/expediente/${expedienteId}/historial`, { headers });
  }

  registrarExpediente(expediente: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/registrar`, expediente, {
      headers: this.getHeaders()
    });
  }

  registrarDocumento(expedienteId: number, documento: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/${expedienteId}/documento`, documento, {
      headers: this.getHeaders()
    });
  }

  registrarCargo(cargo: FormData): Observable<any> {
    const token = localStorage.getItem('jwt') || '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.post(`http://localhost:8080/api/cargos/cargo`, cargo, { headers });
  }
  getExpedienteDetalle(id: number): Observable<any> {
    const token = localStorage.getItem('jwt'); // O de donde guardes el token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`http://localhost:8080/api/expedientes/${id}/detalle`, { headers });
  }
}
