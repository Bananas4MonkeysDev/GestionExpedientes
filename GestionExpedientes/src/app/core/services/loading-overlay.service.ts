// src/app/services/loading-overlay.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingOverlayService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  show(): void {
    this.loadingSubject.next(true);
    document.body.style.overflow = 'hidden'; // desactivar scroll
  }

  hide(): void {
    this.loadingSubject.next(false);
    document.body.style.overflow = ''; // restaurar scroll
  }
}
