import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiMealPlannerDialogComponent } from './ai-meal-planner-dialog.component';

describe('AiMealPlannerDialogComponent', () => {
  let component: AiMealPlannerDialogComponent;
  let fixture: ComponentFixture<AiMealPlannerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiMealPlannerDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiMealPlannerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
