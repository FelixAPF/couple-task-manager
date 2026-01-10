import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignTasksDialogComponent } from './assign-tasks-dialog.component';

describe('AssignTasksDialogComponent', () => {
  let component: AssignTasksDialogComponent;
  let fixture: ComponentFixture<AssignTasksDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignTasksDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignTasksDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
