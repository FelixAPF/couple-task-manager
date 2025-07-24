import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactDetailsDialogComponent } from './contact-details-dialog.component';

describe('ContactDetailsDialogComponent', () => {
  let component: ContactDetailsDialogComponent;
  let fixture: ComponentFixture<ContactDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactDetailsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
