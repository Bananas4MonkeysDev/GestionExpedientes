import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Referencia {
  id: string;     // clave primaria o id única
  tipo: 'Documento' | 'Expediente';
  serie: string;
  asunto: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReferenciaService {
  private apiUrl = 'http://localhost:8080/api/referencias';

  constructor(private http: HttpClient) { }

  obtenerReferencias(): Observable<Referencia[]> {
    const token = localStorage.getItem('jwtToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Referencia[]>(this.apiUrl, { headers });
  }
}
