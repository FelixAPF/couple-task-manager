import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroceryFundComponent } from './grocery-fund.component';

describe('GroceryFundComponent', () => {
  let component: GroceryFundComponent;
  let fixture: ComponentFixture<GroceryFundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroceryFundComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroceryFundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
