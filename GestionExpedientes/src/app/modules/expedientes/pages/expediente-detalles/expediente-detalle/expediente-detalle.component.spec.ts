import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpedienteDetalleComponent } from './expediente-detalle.component';

describe('ExpedienteDetalleComponent', () => {
  let component: ExpedienteDetalleComponent;
  let fixture: ComponentFixture<ExpedienteDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpedienteDetalleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpedienteDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
