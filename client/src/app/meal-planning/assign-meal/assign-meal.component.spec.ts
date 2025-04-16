import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignMealComponent } from './assign-meal.component';

describe('AssignMealComponent', () => {
  let component: AssignMealComponent;
  let fixture: ComponentFixture<AssignMealComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignMealComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignMealComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
