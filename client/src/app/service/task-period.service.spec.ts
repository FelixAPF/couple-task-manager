import { TestBed } from '@angular/core/testing';

import { TaskPeriodService } from './task-period.service';

describe('TaskPeriodService', () => {
  let service: TaskPeriodService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskPeriodService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
