import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentoAgregarComponent } from './documento-agregar.component';

describe('DocumentoAgregarComponent', () => {
  let component: DocumentoAgregarComponent;
  let fixture: ComponentFixture<DocumentoAgregarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentoAgregarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentoAgregarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
