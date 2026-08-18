import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HouseholdFundComponent } from './household-fund.component';

describe('HouseholdFundComponent', () => {
  let component: HouseholdFundComponent;
  let fixture: ComponentFixture<HouseholdFundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HouseholdFundComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HouseholdFundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
