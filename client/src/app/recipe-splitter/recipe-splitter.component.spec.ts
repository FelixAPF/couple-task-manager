import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipeSplitterComponent } from './recipe-splitter.component';

describe('RecipeSplitterComponent', () => {
  let component: RecipeSplitterComponent;
  let fixture: ComponentFixture<RecipeSplitterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeSplitterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecipeSplitterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
