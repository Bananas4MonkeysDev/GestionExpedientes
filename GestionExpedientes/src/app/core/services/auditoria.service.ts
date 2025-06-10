import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private baseUrl = 'http://localhost:8080/api/auditoria';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt');
    console.log('[DEBUG] JWT token Auditoria:', token);
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  registrarAuditoria(auditoria: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/registrar`, auditoria, {
      headers: this.getHeaders()
    });
  }

  obtenerAuditorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/todas`, {
      headers: this.getHeaders()
    });
  }

  getAuditoriasPorExpediente(expedienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/por-expediente/${expedienteId}`, {
      headers: this.getHeaders()
    });
  }
}
