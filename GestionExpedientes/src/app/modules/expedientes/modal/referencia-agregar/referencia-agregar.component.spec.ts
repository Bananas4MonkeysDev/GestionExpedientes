import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferenciaAgregarComponent } from './referencia-agregar.component';

describe('ReferenciaAgregarComponent', () => {
  let component: ReferenciaAgregarComponent;
  let fixture: ComponentFixture<ReferenciaAgregarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReferenciaAgregarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReferenciaAgregarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
