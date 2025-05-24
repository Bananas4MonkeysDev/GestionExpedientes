import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpedientesMonitoreoComponent } from './expedientes-monitoreo.component';

describe('ExpedientesMonitoreoComponent', () => {
  let component: ExpedientesMonitoreoComponent;
  let fixture: ComponentFixture<ExpedientesMonitoreoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpedientesMonitoreoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpedientesMonitoreoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
