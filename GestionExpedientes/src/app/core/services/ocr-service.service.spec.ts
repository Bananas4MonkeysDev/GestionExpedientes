import { TestBed } from '@angular/core/testing';

import { OcrService } from './ocr-service.service';

describe('OcrServiceService', () => {
  let service: OcrService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OcrService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
