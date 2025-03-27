import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickCompleteTaskComponent } from './quick-complete-task.component';

describe('QuickCompleteTaskComponent', () => {
  let component: QuickCompleteTaskComponent;
  let fixture: ComponentFixture<QuickCompleteTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickCompleteTaskComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickCompleteTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
