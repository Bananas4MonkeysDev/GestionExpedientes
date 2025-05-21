import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpedientesRegisterComponent } from './expedientes-register.component';

describe('ExpedientesRegisterComponent', () => {
  let component: ExpedientesRegisterComponent;
  let fixture: ComponentFixture<ExpedientesRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpedientesRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpedientesRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
