import { TestBed } from '@angular/core/testing';

import { GrupoAreaService } from './grupo-area.service';

describe('GrupoAreaService', () => {
  let service: GrupoAreaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GrupoAreaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
