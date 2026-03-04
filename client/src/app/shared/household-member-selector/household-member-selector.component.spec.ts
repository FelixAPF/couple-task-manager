import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HouseholdMemberSelectorComponent } from './household-member-selector.component';

describe('HouseholdMemberSelectorComponent', () => {
  let component: HouseholdMemberSelectorComponent;
  let fixture: ComponentFixture<HouseholdMemberSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HouseholdMemberSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HouseholdMemberSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
