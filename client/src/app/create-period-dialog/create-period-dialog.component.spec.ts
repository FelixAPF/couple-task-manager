import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePeriodDialogComponent } from './create-period-dialog.component';

describe('CreatePeriodDialogComponent', () => {
  let component: CreatePeriodDialogComponent;
  let fixture: ComponentFixture<CreatePeriodDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePeriodDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePeriodDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
