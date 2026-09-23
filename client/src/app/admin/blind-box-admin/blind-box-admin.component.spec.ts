import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlindBoxAdminComponent } from './blind-box-admin.component';

describe('BlindBoxAdminComponent', () => {
  let component: BlindBoxAdminComponent;
  let fixture: ComponentFixture<BlindBoxAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlindBoxAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlindBoxAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
