import { TestBed } from '@angular/core/testing';

import { OcrServiceService } from './ocr-service.service';

describe('OcrServiceService', () => {
  let service: OcrServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OcrServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
