import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanCartaComponent } from './scan-carta.component';

describe('ScanCartaComponent', () => {
  let component: ScanCartaComponent;
  let fixture: ComponentFixture<ScanCartaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanCartaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScanCartaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
