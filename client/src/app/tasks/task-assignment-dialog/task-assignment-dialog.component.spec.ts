import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskAssignmentDialogComponent } from './task-assignment-dialog.component';

describe('TaskAssignmentDialogComponent', () => {
  let component: TaskAssignmentDialogComponent;
  let fixture: ComponentFixture<TaskAssignmentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskAssignmentDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskAssignmentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
