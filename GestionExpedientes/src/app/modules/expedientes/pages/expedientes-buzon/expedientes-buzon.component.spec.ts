import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpedientesBuzonComponent } from './expedientes-buzon.component';

describe('ExpedientesBuzonComponent', () => {
  let component: ExpedientesBuzonComponent;
  let fixture: ComponentFixture<ExpedientesBuzonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpedientesBuzonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpedientesBuzonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
