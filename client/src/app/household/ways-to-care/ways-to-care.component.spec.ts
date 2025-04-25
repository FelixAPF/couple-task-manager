import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaysToCareComponent } from './ways-to-care.component';

describe('WaysToCareComponent', () => {
  let component: WaysToCareComponent;
  let fixture: ComponentFixture<WaysToCareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaysToCareComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaysToCareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
