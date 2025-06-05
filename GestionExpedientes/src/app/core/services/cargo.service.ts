import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CargoService {
  private apiUrl = 'http://localhost:8080/api/public/cargo/uuid';

  constructor(private http: HttpClient) {}

  // Obtener cargo por UUID
  getCargoPorUuid(uuid: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${uuid}`);
  }

  // URL para descargar archivo PDF por UUID
  obtenerUrlDescarga(uuid: string): string {
    return `${this.apiUrl}/${uuid}/descargar`;
  }
}
