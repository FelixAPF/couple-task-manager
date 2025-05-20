import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { ShoppingService } from '../../service/shopping.service';
import { ItemType, ShoppingItem, Store } from '../../model/shopping-item';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { TagSeverity } from '../../meal-planning/recipes-list/recipes-list.component';
import { TitleCasePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { finalize } from 'rxjs';
import { InputNumberModule } from 'primeng/inputnumber'; // Still needed for the add form
// ButtonModule is likely in SharedModule, ensure it's available for pButton

export interface GroupedShoppingItems {
  store: Store;
  storeDisplayName: string;
  items: ShoppingItem[];
  severity: TagSeverity;
}

@Component({
  selector: 'app-shopping-list',
  imports: [SharedModule, ReactiveFormsModule, FormsModule, InputNumberModule], // InputNumberModule kept for add form
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.css',
  providers: [MessageService, ConfirmationService, TitleCasePipe]
})
export class ShoppingListComponent implements OnInit {
  private shoppingService = inject(ShoppingService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService); // Kept if you want to use it for actual deletion elsewhere
  private titleCasePipe = inject(TitleCasePipe);

  public mainActionTooltipOptions = { showDelay: 500, hideDelay: 300 };
  public quantityButtonTooltipOptions = { showDelay: 700, hideDelay: 300 };

  isAdding = signal(false);
  storeOptions: SelectItem[] = [];
  nameSuggestions: string[] = [];
  shoppingItemsFlat = signal<ShoppingItem[]>([]);

  groupedShoppingList = computed(() => {
    const flatList = this.shoppingItemsFlat();
    const groups = new Map<Store, ShoppingItem[]>();
    const sortedFlatList = [...flatList].sort((a, b) => {
      const storeComparison = a.store.localeCompare(b.store);
      if (storeComparison !== 0) return storeComparison;
      return a.name.localeCompare(b.name);
    });

    for (const item of sortedFlatList) {
      if (!groups.has(item.store)) {
        groups.set(item.store, []);
      }
      groups.get(item.store)!.push(item);
    }

    return Array.from(groups.entries())
      .map(([store, storeItems]) => ({
        store: store,
        storeDisplayName: this.titleCasePipe.transform(store.replace(/_/g, ' ')),
        items: storeItems,
        severity: this.getStoreTagSeverity(store)
      }))
      .sort((a, b) => a.storeDisplayName.localeCompare(b.storeDisplayName));
  });

  addItemForm: FormGroup;

  constructor() {
    this.addItemForm = this.fb.group({
      name: ['', Validators.required],
      store: [Store.AUTRE, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadItems();
    this.loadStoreOptions();
  }

  loadItems(): void {
    this.shoppingService.retrieveShoppingListNotBought()
      .subscribe({
        next: (items) => {
          this.shoppingItemsFlat.set(items.map(item => ({
            ...item,
            quantity: item.quantity === undefined || item.quantity === null || item.quantity < 1 ? 1 : item.quantity
          })));
        },
        error: (err) => this.handleError(err, 'Impossible de charger la liste d\'épicerie.')
      });
  }

  loadStoreOptions(): void {
    this.storeOptions = this.shoppingService.getStoreEnumValues().map(store => ({
      label: this.titleCasePipe.transform(store.replace(/_/g, ' ')),
      value: store
    }));
  }

  searchNameSuggestions(event: AutoCompleteCompleteEvent): void {
    this.shoppingService.listNameSuggestions().subscribe(suggestions => {
        this.nameSuggestions = suggestions.filter(s => s.toLowerCase().includes(event.query.toLowerCase()));
    });
  }

  handleAddItem(): void {
    this.addItemForm.markAllAsTouched();
    if (this.addItemForm.invalid) return;

    this.isAdding.set(true);
    const formValue = this.addItemForm.value;
    const newItemPrototype: ShoppingItem = {
      id: 0, name: formValue.name.trim(), store: formValue.store,
      quantity: formValue.quantity, bought: false, type: ItemType.GROCERY
    };

    this.shoppingService.addShoppingItem(newItemPrototype)
      .pipe(finalize(() => this.isAdding.set(false)))
      .subscribe({
        next: (addedItem) => {
          const newItem = { ...addedItem, quantity: Math.max(1, addedItem.quantity || 1) };
          this.shoppingItemsFlat.update(currentItems => [...currentItems, newItem]);
          this.messageService.add({ severity: 'success', summary: 'Ajouté', detail: `"${newItem.name}" ajouté.` });
          this.addItemForm.reset({ store: Store.AUTRE, name: '', quantity: 1 });
        },
        error: (err) => this.handleError(err, 'Impossible d\'ajouter l\'article.')
      });
  }

  private _updateItemQuantity(item: ShoppingItem, newQuantity: number): void {
    const quantityToUpdate = Math.max(1, newQuantity); // Ensure quantity is at least 1
    const originalQuantity = item.quantity;

    // Optimistic UI update
    item.quantity = quantityToUpdate;
    this.shoppingItemsFlat.update(currentItems =>
      currentItems.map(i =>
        i.id === item.id ? { ...i, quantity: quantityToUpdate } : i
      )
    );

    this.shoppingService.updateQuantity(item.id, quantityToUpdate)
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Quantité mise à jour', detail: `"${item.name}" quantité: ${quantityToUpdate}.` });
        },
        error: (err) => {
          // Revert optimistic update
          item.quantity = originalQuantity;
          this.shoppingItemsFlat.update(currentItems =>
            currentItems.map(i =>
              i.id === item.id ? { ...i, quantity: originalQuantity! } : i // Revert to original
            )
          );
          this.handleError(err, `Impossible de mettre à jour la quantité pour "${item.name}".`);
        }
      });
  }

  incrementQuantity(item: ShoppingItem): void {
    if (item.bought) return;
    const currentQty = item.quantity === undefined || item.quantity === null ? 0 : item.quantity;
    this._updateItemQuantity(item, currentQty + 1);
  }

  decrementQuantity(item: ShoppingItem): void {
    if (item.bought) return;
    const currentQty = item.quantity === undefined || item.quantity === null ? 1 : item.quantity;
    if (currentQty <= 1) return; // Cannot go below 1
    this._updateItemQuantity(item, currentQty - 1);
  }

  toggleBoughtStatus(item: ShoppingItem): void {
    const updatedItemState = { ...item, bought: !item.bought };

    // Optimistic update
    item.bought = updatedItemState.bought;
     this.shoppingItemsFlat.update(currentItems =>
      currentItems.map(i => (i.id === item.id ? { ...i, bought: updatedItemState.bought } : i))
    );


    this.shoppingService.updateShoppingItem(updatedItemState)
      .subscribe({
        next: (responseItem) => {
          // Ensure local state matches confirmed backend state
          this.shoppingItemsFlat.update(currentItems =>
            currentItems.map(i => (i.id === responseItem.id ? { ...i, ...responseItem } : i))
          );
          this.messageService.add({ severity: 'info', summary: 'Statut modifié', detail: `"${responseItem.name}" marqué comme ${responseItem.bought ? 'acheté' : 'non acheté'}.` });
          
          // If item is marked as bought, refresh the "not-bought" list
          if (responseItem.bought) {
            // Give a slight delay for the user to see the change before it disappears
            setTimeout(() => this.loadItems(), 300);
          }
        },
        error: (err) => {
          // Revert optimistic update
          item.bought = !updatedItemState.bought; // Revert item directly
           this.shoppingItemsFlat.update(currentItems =>
            currentItems.map(i => (i.id === item.id ? { ...i, bought: !updatedItemState.bought } : i))
          );
          this.handleError(err, 'Impossible de modifier le statut de l\'article.');
        }
      });
  }
  
  // Optional: Consolidate error handling
  private handleError(error: any, defaultMessage: string): void {
    console.error(error);
    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: defaultMessage });
  }

  getStoreTagSeverity(store: Store): TagSeverity {
    switch (store) {
      case Store.COSTCO: return 'info';
      case Store.SUPER_C: return 'danger';
      case Store.MAXI: return 'warn';
      case Store.IGA: return 'success';
      case Store.METRO: return 'contrast';
      case Store.SAQ: return 'secondary';
      case Store.AMAZON: return 'warn';
      case Store.WALMART: return 'info';
      default: return 'secondary';
    }
  }

  trackById(index: number, item: ShoppingItem): number { return item.id; }
  trackStoreGroup(index: number, group: GroupedShoppingItems): string { return group.store; }
}