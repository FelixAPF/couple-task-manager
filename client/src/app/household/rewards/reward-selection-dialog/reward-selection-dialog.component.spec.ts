import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RewardSelectionDialogComponent } from './reward-selection-dialog.component';

describe('RewardSelectionDialogComponent', () => {
  let component: RewardSelectionDialogComponent;
  let fixture: ComponentFixture<RewardSelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RewardSelectionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RewardSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
