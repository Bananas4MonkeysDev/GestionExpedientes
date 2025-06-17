import { Component, ElementRef, ViewChild } from '@angular/core';
import { OcrService } from '../../../../core/services/ocr-service.service';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-scan-carta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scan-carta.component.html',
  styleUrls: ['./scan-carta.component.css']
})
export class ScanCartaComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('imgRef') imgRef!: ElementRef<HTMLImageElement>;
  isLoading = false;
  ocrResult: string | null = null;
  selectedFile!: File;
  imagenSrc: string | null = null;
  mostrarResultado = false;

  selection = {
    startX: 0, startY: 0, endX: 0, endY: 0,
    active: false, completed: false
  };

  constructor(
    private ocrService: OcrService,
    private dialogRef: MatDialogRef<ScanCartaComponent>,
    private cd: ChangeDetectorRef
  ) {
    dialogRef.disableClose = true; // ⛔️ no permitir cerrar clic fuera
  }

  cerrar() {
    this.dialogRef.close();
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
    this.cd.detectChanges();
    console.log('🟠 Selección completada:', this.getSelectionStyle());
  }

  getSelectionStyle() {
    const x = Math.min(this.selection.startX, this.selection.endX);
    const y = Math.min(this.selection.startY, this.selection.endY);
    const width = Math.abs(this.selection.endX - this.selection.startX);
    const height = Math.abs(this.selection.endY - this.selection.startY);
    return { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px`, position: 'absolute' };
  }

  procesarSeleccion() {
    this.isLoading = true;
    this.cd.detectChanges();
    this.ocrResult = null;

    const img = this.imgRef.nativeElement;
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    const x = Math.min(this.selection.startX, this.selection.endX) * scaleX;
    const y = Math.min(this.selection.startY, this.selection.endY) * scaleY;
    const width = Math.abs(this.selection.endX - this.selection.startX) * scaleX;
    const height = Math.abs(this.selection.endY - this.selection.startY) * scaleY;

    console.log('📐 Región para OCR:', { x, y, width, height });

    this.ocrService.enviarZona(this.selectedFile, 1, { x, y, width, height }).subscribe({
      next: (resp) => {
        console.log('✅ Texto OCR:', resp.texto_extraido);
        this.ocrResult = resp.texto_extraido;
        this.isLoading = false;
        this.mostrarResultado = true; // ✅ Cambia la vista
      },
      error: (err) => {
        console.error('💥 Error al procesar OCR:', err);
        this.ocrResult = 'Error al procesar la imagen.';
        this.isLoading = false;
      }
    });
  }

}