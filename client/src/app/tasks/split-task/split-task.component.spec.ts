import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitTaskComponent } from './split-task.component';

describe('SplitTaskComponent', () => {
  let component: SplitTaskComponent;
  let fixture: ComponentFixture<SplitTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitTaskComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SplitTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
