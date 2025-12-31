import { TestBed } from '@angular/core/testing';

import { TaskListOccasionServiceService } from './task-list-occasion-service.service';

describe('TaskListOccasionServiceService', () => {
  let service: TaskListOccasionServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskListOccasionServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
