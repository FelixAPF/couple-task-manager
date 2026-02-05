import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateLetterComponent } from './create-letter.component';

describe('CreateLetterComponent', () => {
  let component: CreateLetterComponent;
  let fixture: ComponentFixture<CreateLetterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateLetterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateLetterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
