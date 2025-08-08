import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelTemplateComponent } from './travel-template.component';

describe('TravelTemplateComponent', () => {
  let component: TravelTemplateComponent;
  let fixture: ComponentFixture<TravelTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelTemplateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
