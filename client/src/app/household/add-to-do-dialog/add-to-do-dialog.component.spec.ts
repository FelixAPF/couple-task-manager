import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddToDoDialogComponent } from './add-to-do-dialog.component';

describe('AddToDoDialogComponent', () => {
  let component: AddToDoDialogComponent;
  let fixture: ComponentFixture<AddToDoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddToDoDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddToDoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
