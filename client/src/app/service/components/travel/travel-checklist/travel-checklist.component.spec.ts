import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelChecklistComponent } from './travel-checklist.component';

describe('TravelChecklistComponent', () => {
  let component: TravelChecklistComponent;
  let fixture: ComponentFixture<TravelChecklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelChecklistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelChecklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
