// expediente.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface FlujoProceso {
  id: number;
  estado: 'PENDIENTE' | 'FIRMADO';
  expediente_id: number;
  fecha_limite: string;
  nivel: number;
  tipo_nivel: 'General' | 'Especifico';
  documentos_id: string; // Puedes parsearlo a string[] si deseas luego
  usuarios: string; // Ej: "10|12|3"
}
export interface EstadoFirmaResponse {
  yaFirmo: boolean;
  usuariosTotales: number;
  firmantesTotales: number;
  docYaFirmado?: boolean;
  mostrarBoton: boolean;
  tipo: string;
}


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
  obtenerPdfsDesdeRuta(ruta: string) {
    return this.http.post<any[]>(`${this.baseUrl}/documentos/listar-pdfs`, { ruta });
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
  getPorIds(ids: any[]): Observable<any[]> {
    const idsParam = encodeURIComponent(ids.join('|'));
    const token = localStorage.getItem('jwt') || '';
    console.log('[DEBUG] JWT token:', localStorage.getItem('jwt'));

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<any[]>(`http://localhost:8080/api/documentos/por-ids?ids=${idsParam}`, { headers });
  }
  actualizarFlujoProceso(id: number, flujoActualizado: any): Observable<any> {
    console.log("[Front] Actualizando flujo con ID: " + id);
    const token = localStorage.getItem('jwt') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.put(`http://localhost:8080/api/flujo-proceso/actualizar/${id}`, flujoActualizado, { headers });
  }
  eliminarFlujoProceso(id: number): Observable<any> {
    const token = localStorage.getItem('jwt') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.delete(`http://localhost:8080/api/flujo-proceso/eliminar/${id}`, { headers });
  }
  registrarDocumentoPorUrl(expedienteId: number, data: any) {
    return this.http.post<any>(`${this.baseUrl}/${expedienteId}/documento-por-ruta`, data);
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
  obtenerExpedientesPorFirma(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/asignados-por-firma/${usuarioId}`, {
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
  registrarFlujoProceso(data: any): Observable<any> {
    console.log("Datos a enviar:", data);
    return this.http.post(`http://localhost:8080/api/flujo-proceso/registrar`, data, {
      headers: this.getHeaders()
    });
  }
  obtenerFlujosPorExpediente(id: number): Observable<FlujoProceso[]> {
    return this.http.get<FlujoProceso[]>(`http://localhost:8080/api/flujo-proceso/por-expediente/${id}`, {
      headers: this.getHeaders()
    });
  }

  obtenerDocumentosFirmables(expedienteId: number, usuarioId: number) {
    return this.http.get<any[]>(`${this.baseUrl}/${expedienteId}/documentos-firmables`, {
      params: { usuarioId }
    });
  }
  observarNivel(flujoId: number, comentario: string): Observable<void> {
    return this.http.delete<void>(
      `http://localhost:8080/api/flujo-proceso/observar/${flujoId}`,
      {
        params: { comentario }, headers: this.getHeaders()
      });
  }

  verEstadoFirma(flujoId: number, usuarioId: number, documentoId: number) {
    return this.http.get<EstadoFirmaResponse>(
      `http://localhost:8080/api/flujo-proceso/firma/estado`,
      {
        params: { flujoId, usuarioId, documentoId }, headers: this.getHeaders()
      });
  }

  registrarComentario(comentarioData: any) {
    return this.http.post(`http://localhost:8080/api/expedientes/comentarios`, comentarioData, {
      headers: this.getHeaders()
    });
  }
  // expediente.service.ts
  firmarDocumento(flujoId: number, documentoId: number, usuarioId: number): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`
    });

    return this.http.post<any>(
      `http://localhost:8080/api/flujo-proceso/firmar/${flujoId}/${documentoId}/${usuarioId}`, { headers }
    );
  }


}
