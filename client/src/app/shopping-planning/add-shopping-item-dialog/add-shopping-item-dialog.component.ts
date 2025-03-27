import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Task } from '../../model/task';
import { ItemType, ShoppingItem, Store } from '../../model/shopping-item';
import { SharedModule } from '../../shared.module';
import { TranslateService } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ShoppingService } from '../../service/shopping.service';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';

enum FormControlName {
  NAME = 'name',
  BOUGHT = 'bought',
  STORE = 'store',
  ID = 'id',
  TYPE = 'type',
}
@Component({
  selector: 'app-add-shopping-item-dialog',
  imports: [SharedModule, ReactiveFormsModule],
  templateUrl: './add-shopping-item-dialog.component.html',
  styleUrl: './add-shopping-item-dialog.component.css'
})
export class AddShoppingItemDialogComponent implements OnInit {
  fb = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({});
  subscription: Subscription = new Subscription();
  SHOPPING_ITEM_TYPE = ItemType;
  STORE = Store;
  suggestions: any[] = [];
  filteredSuggestions: any[] = [];

  
  get bought(): FormControlName { return FormControlName.BOUGHT; }
  get name(): FormControlName { return FormControlName.NAME; }
  get store(): FormControlName { return FormControlName.STORE; }
  get id(): FormControlName { return FormControlName.ID; }
  get type(): FormControlName { return FormControlName.TYPE; }
  get shoppingTypes() {
    return Object.values(this.SHOPPING_ITEM_TYPE).map(key => ({
      label: this.translate.instant(`SHOPPING_ITEM_TYPE.${key}`),
      value: key
    }));
  }
  get stores() {
    return Object.values(this.STORE).map(key => ({
      label: this.translate.instant(`STORE.${key}`),
      value: key
    }));
  }

  constructor(private translate: TranslateService, private ref: DynamicDialogRef, private config: DynamicDialogConfig, private shoppingService: ShoppingService) {
    this.buildFormGroup(this.config.data.shoppingItem);  
  }

  buildFormGroup(shoppingItem: ShoppingItem | null = null){
    this.formGroup = this.fb.group({
      [FormControlName.NAME]: [shoppingItem?.name || "", []],
      [FormControlName.BOUGHT]: [shoppingItem?.bought || false, []],
      [FormControlName.STORE]: [shoppingItem?.store || '',  [Validators.required]],
      [FormControlName.ID]: [shoppingItem?.id || null, []],
      [FormControlName.TYPE]: [shoppingItem?.type || ItemType.GROCERY, [Validators.required]]
    });
  }

  retrieveNameSuggestions(){
    this.subscription.add(this.shoppingService.listNameSuggestions().subscribe((suggestions) => {
      this.suggestions = suggestions;
    }));
  }

  ngOnInit(): void {
    this.retrieveNameSuggestions();
  }

  search(event: AutoCompleteCompleteEvent) {
    this.filteredSuggestions = event.query ? this.suggestions.filter((item) => item.toLowerCase().includes(event.query.toLowerCase())) : this.suggestions;
    }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  save(){
    const item = this.formGroup.getRawValue() as ShoppingItem;
    if(item.id){
      this.shoppingService.updateShoppingList(item).subscribe(() => {
        this.ref.close();
      });
      return;
    }

    this.shoppingService.addShoppingItem(item).subscribe(() => {
      this.ref.close();
    });
  }

  close(){
    this.ref.close();
  }
}
