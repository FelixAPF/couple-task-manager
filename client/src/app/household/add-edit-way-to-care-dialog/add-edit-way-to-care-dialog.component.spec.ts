import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditWayToCareDialogComponent } from './add-edit-way-to-care-dialog.component';

describe('AddEditWayToCareDialogComponent', () => {
  let component: AddEditWayToCareDialogComponent;
  let fixture: ComponentFixture<AddEditWayToCareDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditWayToCareDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditWayToCareDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
