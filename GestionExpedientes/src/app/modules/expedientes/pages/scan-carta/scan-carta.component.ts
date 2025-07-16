import { Component, ElementRef, ViewChild } from '@angular/core';
import { OcrService } from '../../../../core/services/ocr-service.service';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-scan-carta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scan-carta.component.html',
  styleUrls: ['./scan-carta.component.css']
})
export class ScanCartaComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('imgRef') imgRef!: ElementRef<HTMLImageElement>;
  isLoading = false;
  selectedFile!: File;
  imagenSrc: string | null = null;
  mostrarResultado = false;
  zonasSeleccionadas: {
    coords: { x: number, y: number, width: number, height: number },
    texto?: string,
    campoDestino?: 'asunto' | 'emisor' | 'destinatario' | 'referencia' | null
  }[] = [];

  selection = {
    startX: 0, startY: 0, endX: 0, endY: 0,
    active: false, completed: false
  };

  constructor(
    private ocrService: OcrService,
    private dialogRef: MatDialogRef<ScanCartaComponent>,
    private cd: ChangeDetectorRef
  ) {
    dialogRef.disableClose = true;
  }

  cerrar() {
    const resultados = this.zonasSeleccionadas
      .filter(z => z.texto && z.campoDestino)
      .map(z => ({ texto: z.texto!.trim(), destino: z.campoDestino! }));

    if (resultados.length === 0) {
      this.dialogRef.close();
      return;
    }

    this.dialogRef.close(resultados);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      console.log('📁 Archivo seleccionado:', this.selectedFile.name);
      this.isLoading = true;
      this.cd.detectChanges();
      this.selection.completed = false;

      this.ocrService.obtenerImagen(this.selectedFile, 1).subscribe({
        next: (imgBlob) => {
          this.isLoading = false;
          const url = URL.createObjectURL(imgBlob);
          this.imagenSrc = url;
          console.log('🖼️ Imagen recibida correctamente desde backend');
        },
        error: (err) => {
          this.isLoading = false;
          console.error('❌ Error al obtener imagen desde backend:', err);
        }
      });
    }
  }

  startSelection(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const rect = this.imgRef.nativeElement.getBoundingClientRect();
    this.selection.startX = event.clientX - rect.left;
    this.selection.startY = event.clientY - rect.top;
    this.selection.endX = this.selection.startX;
    this.selection.endY = this.selection.startY;
    this.selection.active = true;
    this.selection.completed = false;
  }

  updateSelection(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.selection.active) return;

    const rect = this.imgRef.nativeElement.getBoundingClientRect();
    this.selection.endX = event.clientX - rect.left;
    this.selection.endY = event.clientY - rect.top;
  }

  endSelection(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.selection.active) return;

    this.selection.active = false;
    this.selection.completed = true;

    const img = this.imgRef.nativeElement;
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    const x = Math.min(this.selection.startX, this.selection.endX) * scaleX;
    const y = Math.min(this.selection.startY, this.selection.endY) * scaleY;
    const width = Math.abs(this.selection.endX - this.selection.startX) * scaleX;
    const height = Math.abs(this.selection.endY - this.selection.startY) * scaleY;

    const zona = { coords: { x, y, width, height }, texto: '', campoDestino: null };
    this.zonasSeleccionadas.push(zona);
    this.cd.detectChanges();

    console.log('🟠 Zona agregada:', zona);
  }
  getZonasVisuales(): { x: number, y: number, width: number, height: number }[] {
    if (!this.imgRef?.nativeElement) return [];

    const img = this.imgRef.nativeElement;
    const scaleX = img.clientWidth / img.naturalWidth;
    const scaleY = img.clientHeight / img.naturalHeight;

    return this.zonasSeleccionadas.map(z => {
      return {
        x: z.coords.x * scaleX,
        y: z.coords.y * scaleY,
        width: z.coords.width * scaleX,
        height: z.coords.height * scaleY
      };
    });
  }
  eliminarZona(index: number) {
    this.zonasSeleccionadas.splice(index, 1);
  }


  getSelectionStyle() {
    const x = Math.min(this.selection.startX, this.selection.endX);
    const y = Math.min(this.selection.startY, this.selection.endY);
    const width = Math.abs(this.selection.endX - this.selection.startX);
    const height = Math.abs(this.selection.endY - this.selection.startY);
    return { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px`, position: 'absolute' };
  }

  procesarSeleccion() {
    if (this.zonasSeleccionadas.length === 0) return;

    this.isLoading = true;
    const img = this.imgRef.nativeElement;
    const file = this.selectedFile;

    let zonasProcesadas = 0;

    for (const zona of this.zonasSeleccionadas) {
      const { x, y, width, height } = zona.coords;

      this.ocrService.enviarZona(file, 1, { x, y, width, height }).subscribe({
        next: (resp) => {
          zona.texto = resp.texto_extraido;
          zonasProcesadas++;
          console.log(`✅ Zona ${zonasProcesadas}:`, zona);

          if (zonasProcesadas === this.zonasSeleccionadas.length) {
            this.isLoading = false;
            this.mostrarResultado = true;
            this.cd.detectChanges();
          }
        },
        error: (err) => {
          console.error('💥 Error al procesar OCR:', err);
          zona.texto = 'Error al procesar.';
          zonasProcesadas++;
          if (zonasProcesadas === this.zonasSeleccionadas.length) {
            this.isLoading = false;
            this.mostrarResultado = true;
            this.cd.detectChanges();
          }
        }
      });
    }
  }

}