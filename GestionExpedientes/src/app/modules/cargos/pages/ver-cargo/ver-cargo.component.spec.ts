import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerCargoComponent } from './ver-cargo.component';

describe('VerCargoComponent', () => {
  let component: VerCargoComponent;
  let fixture: ComponentFixture<VerCargoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerCargoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerCargoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
