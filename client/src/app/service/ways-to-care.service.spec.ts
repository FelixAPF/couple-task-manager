import { TestBed } from '@angular/core/testing';

import { WaysToCareService } from './ways-to-care.service';

describe('WaysToCareService', () => {
  let service: WaysToCareService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WaysToCareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
