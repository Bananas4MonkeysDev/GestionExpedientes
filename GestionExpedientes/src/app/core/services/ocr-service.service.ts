import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class OcrService {
  private baseUrl = 'http://localhost:8080/api/ocr';

  constructor(private http: HttpClient, private authService: AuthService) { }
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken(); // o localStorage.getItem('jwt')
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  escanearDocumento(archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', archivo);

    return this.http.post<any>(`${this.baseUrl}/extraer`, formData, {
      headers: this.getAuthHeaders()
    });
  }
  obtenerImagen(file: File, page: number): Observable<Blob> {
    console.log('📤 Enviando PDF al backend Java para obtener imagen');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('page', page.toString());

    return this.http.post(`${this.baseUrl}/imagen-pdf`, formData, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }


  enviarZona(file: File, page: number, region: { x: number, y: number, width: number, height: number }): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('page', page.toString());
    formData.append('x', region.x.toString());
    formData.append('y', region.y.toString());
    formData.append('width', region.width.toString());
    formData.append('height', region.height.toString());
    return this.http.post(`${this.baseUrl}/extraer-region`, formData, {
      headers: this.getAuthHeaders()
    });
  }

  escanearDocumento2(
    archivo: File,
    page: number,
    region: { x: number; y: number; width: number; height: number }
  ): Observable<any> {
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('page', Math.floor(page).toString());
    formData.append('x', region.x.toString());
    formData.append('y', region.y.toString());
    formData.append('width', region.width.toString());
    formData.append('height', region.height.toString());

    return this.http.post<any>(`${this.baseUrl}/extraer-region`, formData, {
      headers: this.getAuthHeaders()
    });
  }
}