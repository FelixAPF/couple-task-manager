import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarningTasksDueComponent } from './warning-tasks-due.component';

describe('WarningTasksDueComponent', () => {
  let component: WarningTasksDueComponent;
  let fixture: ComponentFixture<WarningTasksDueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarningTasksDueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarningTasksDueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
