import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeekNavigationControlComponent } from './week-navigation-control.component';

describe('WeekNavigationControlComponent', () => {
  let component: WeekNavigationControlComponent;
  let fixture: ComponentFixture<WeekNavigationControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeekNavigationControlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeekNavigationControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
