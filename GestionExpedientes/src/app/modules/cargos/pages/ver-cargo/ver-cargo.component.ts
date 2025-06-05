import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CargoService } from '../../../../core/services/cargo.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ver-cargo',
  imports: [CommonModule],
  templateUrl: './ver-cargo.component.html',
  styleUrl: './ver-cargo.component.css'
})
export class VerCargoComponent implements OnInit {
  cargo: any = null;
  uuid: string = '';
  urlDescarga: string = '';
  error: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private cargoService: CargoService
  ) { }

  ngOnInit(): void {
    this.uuid = this.route.snapshot.paramMap.get('uuid') ?? '';
    if (!this.uuid) {
      this.error = true;
      return;
    }

    this.cargoService.getCargoPorUuid(this.uuid).subscribe({
      next: (res) => {
        this.cargo = res;
        this.urlDescarga = this.cargoService.obtenerUrlDescarga(this.uuid);
      },
      error: () => {
        this.error = true;
      }
    });
  }
}