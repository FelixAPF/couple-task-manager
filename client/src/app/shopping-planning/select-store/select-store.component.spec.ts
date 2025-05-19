import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectStoreComponent } from './select-store.component';

describe('SelectStoreComponent', () => {
  let component: SelectStoreComponent;
  let fixture: ComponentFixture<SelectStoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectStoreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectStoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
