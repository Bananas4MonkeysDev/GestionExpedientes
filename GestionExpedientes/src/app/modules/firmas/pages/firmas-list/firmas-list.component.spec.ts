import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FirmasListComponent } from './firmas-list.component';

describe('FirmasListComponent', () => {
  let component: FirmasListComponent;
  let fixture: ComponentFixture<FirmasListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirmasListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FirmasListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
