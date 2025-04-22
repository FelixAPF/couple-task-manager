import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinHouseholdComponent } from './join-household.component';

describe('JoinHouseholdComponent', () => {
  let component: JoinHouseholdComponent;
  let fixture: ComponentFixture<JoinHouseholdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinHouseholdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JoinHouseholdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
