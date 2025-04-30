import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalloonContainerComponent } from './balloon-container.component';

describe('BalloonContainerComponent', () => {
  let component: BalloonContainerComponent;
  let fixture: ComponentFixture<BalloonContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalloonContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BalloonContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
