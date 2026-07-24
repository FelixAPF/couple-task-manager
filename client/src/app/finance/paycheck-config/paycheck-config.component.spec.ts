import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaycheckConfigComponent } from './paycheck-config.component';

describe('PaycheckConfigComponent', () => {
  let component: PaycheckConfigComponent;
  let fixture: ComponentFixture<PaycheckConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaycheckConfigComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaycheckConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
