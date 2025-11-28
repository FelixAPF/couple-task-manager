import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MealAssignDialogComponent } from './meal-assign-dialog.component';

describe('MealAssignDialogComponent', () => {
  let component: MealAssignDialogComponent;
  let fixture: ComponentFixture<MealAssignDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MealAssignDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MealAssignDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
