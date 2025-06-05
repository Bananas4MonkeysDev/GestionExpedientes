// src/app/components/loading-overlay/loading-overlay.component.ts
import { Component } from '@angular/core';
import { LoadingOverlayService } from '../core/services/loading-overlay.service';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    imports:[CommonModule],
    selector: 'app-loading-overlay',
    templateUrl: './loading-overlay.component.html',
})
export class LoadingOverlayComponent {
    constructor(public loadingOverlayService: LoadingOverlayService) { }
}
