import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HouseholdExpensesComponent } from './household-expenses.component';

describe('HouseholdExpensesComponent', () => {
  let component: HouseholdExpensesComponent;
  let fixture: ComponentFixture<HouseholdExpensesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HouseholdExpensesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HouseholdExpensesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
