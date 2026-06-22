import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcedureExecutionComponent } from './procedure-execution.component';

describe('ProcedureExecutionComponent', () => {
  let component: ProcedureExecutionComponent;
  let fixture: ComponentFixture<ProcedureExecutionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcedureExecutionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcedureExecutionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
