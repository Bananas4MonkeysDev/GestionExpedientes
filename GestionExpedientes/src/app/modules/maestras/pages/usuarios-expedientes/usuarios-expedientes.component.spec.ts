import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuariosExpedientesComponent } from './usuarios-expedientes.component';

describe('UsuariosExpedientesComponent', () => {
  let component: UsuariosExpedientesComponent;
  let fixture: ComponentFixture<UsuariosExpedientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuariosExpedientesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsuariosExpedientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
