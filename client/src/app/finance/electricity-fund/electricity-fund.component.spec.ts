import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElectricityFundComponent } from './electricity-fund.component';

describe('GroceryFundComponent', () => {
  let component: ElectricityFundComponent;
  let fixture: ComponentFixture<ElectricityFundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElectricityFundComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ElectricityFundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
