import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveMealComponent } from './move-meal.component';

describe('MoveMealComponent', () => {
  let component: MoveMealComponent;
  let fixture: ComponentFixture<MoveMealComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoveMealComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoveMealComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
