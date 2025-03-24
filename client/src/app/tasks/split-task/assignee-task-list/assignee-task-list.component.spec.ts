import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssigneeTaskListComponent } from './assignee-task-list.component';

describe('AssigneeTaskListComponent', () => {
  let component: AssigneeTaskListComponent;
  let fixture: ComponentFixture<AssigneeTaskListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssigneeTaskListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssigneeTaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
