import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddShoppingItemDialogComponent } from './add-shopping-item-dialog.component';

describe('AddShoppingItemDialogComponent', () => {
  let component: AddShoppingItemDialogComponent;
  let fixture: ComponentFixture<AddShoppingItemDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddShoppingItemDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddShoppingItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
