import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogoCargoComponent } from './dialogo-cargo.component';

describe('DialogoCargoComponent', () => {
  let component: DialogoCargoComponent;
  let fixture: ComponentFixture<DialogoCargoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogoCargoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogoCargoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
