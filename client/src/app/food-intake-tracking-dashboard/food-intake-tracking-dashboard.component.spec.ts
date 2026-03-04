import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoodIntakeTrackingDashboardComponent } from './food-intake-tracking-dashboard.component';

describe('FoodIntakeTrackingDashboardComponent', () => {
  let component: FoodIntakeTrackingDashboardComponent;
  let fixture: ComponentFixture<FoodIntakeTrackingDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoodIntakeTrackingDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FoodIntakeTrackingDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
