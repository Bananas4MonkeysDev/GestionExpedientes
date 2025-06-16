import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AreasGruposComponent } from './areas-grupos.component';

describe('AreasGruposComponent', () => {
  let component: AreasGruposComponent;
  let fixture: ComponentFixture<AreasGruposComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AreasGruposComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AreasGruposComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
