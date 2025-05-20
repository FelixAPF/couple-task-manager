import { Component, inject, OnInit } from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { SharedModule } from '../../shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '../../model/shopping-item';
import { TitleCasePipe } from '@angular/common';
import { ShoppingService } from '../../service/shopping.service';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'app-select-store',
  imports: [SharedModule, ReactiveFormsModule, FormsModule],
  templateUrl: './select-store.component.html',
  styleUrl: './select-store.component.css',
  providers: [TitleCasePipe]
})
export class SelectStoreComponent implements OnInit {
  dialogRef = inject(DynamicDialogRef);
  shoppingService = inject(ShoppingService);
  titleCasePipe = inject(TitleCasePipe);
  storeOptions: SelectItem[] = [];

  store = '';
  quantity = null;

  ngOnInit(){
    this.loadStoreOptions();
  }

  loadStoreOptions(): void {
    this.storeOptions = this.shoppingService.getStoreEnumValues().map(store => ({
      label: this.titleCasePipe.transform(store.replace(/_/g, ' ')),
      value: store
    }));
  }



  closeDialog(){
    this.dialogRef.close();
  }

  submitStore(){
    this.dialogRef.close({store: this.store, quantity: this.quantity});
  }
}
