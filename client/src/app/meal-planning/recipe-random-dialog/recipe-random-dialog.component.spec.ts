import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipeRandomDialogComponent } from './recipe-random-dialog.component';

describe('RecipeRandomDialogComponent', () => {
  let component: RecipeRandomDialogComponent;
  let fixture: ComponentFixture<RecipeRandomDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeRandomDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecipeRandomDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
