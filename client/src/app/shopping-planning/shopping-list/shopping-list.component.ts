import { Component, inject, OnInit, signal } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { ShoppingService } from '../../service/shopping.service';
import { ItemType, ShoppingItem, Store } from '../../model/shopping-item';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { TagSeverity } from '../../meal-planning/recipes-list/recipes-list.component';
import { TitleCasePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-shopping-list',
  imports: [SharedModule, ReactiveFormsModule, FormsModule],
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.css',
  providers: [MessageService, ConfirmationService, TitleCasePipe]
})
export class ShoppingListComponent implements OnInit {
  private shoppingService = inject(ShoppingService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private titleCasePipe = inject(TitleCasePipe);

  // --- State ---
  shoppingItems = signal<ShoppingItem[]>([]);
  isAdding = signal(false);
  storeOptions: SelectItem[] = [];
  nameSuggestions: string[] = [];

  // --- Add Item Form ---
  addItemForm: FormGroup;

  constructor() {
    this.addItemForm = this.fb.group({
      name: ['', Validators.required],
      store: [Store.AUTRE, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]] 

    });
  }

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    this.loadItems();
    this.loadStoreOptions();
  }

  // --- Data Loading ---
  loadItems(): void {
      this.shoppingService.retrieveShoppingListNotBought()
        .subscribe({
          next: (items) => {
            this.shoppingItems.set(items.map(item => ({
              ...item,
              quantity: item.quantity === undefined || item.quantity === null || item.quantity < 1 ? 1 : item.quantity // Default to 1
            })).sort((a, b) => {
              const storeComparison = a.store.localeCompare(b.store);
              if (storeComparison !== 0) {
                return storeComparison;
              }
              return a.name.localeCompare(b.name);
            }));
          },
          error: (err) => {
            console.error("Error loading shopping list:", err);
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger la liste d\'épicerie.' });
          }
        });
    }

  loadStoreOptions(): void {
    this.storeOptions = this.shoppingService.getStoreEnumValues().map(store => ({
      label: this.titleCasePipe.transform(store.replace(/_/g, ' ')),
      value: store
    }));
  }

  // --- Event Handlers ---
  searchNameSuggestions(event: AutoCompleteCompleteEvent): void {
    this.shoppingService.listNameSuggestions().subscribe(suggestions => {
        this.nameSuggestions = suggestions.filter(s => s.toLowerCase().includes(event.query.toLowerCase()));
    });
  }

  handleAddItem(): void {
    this.addItemForm.markAllAsTouched();
    if (this.addItemForm.invalid) {
      return;
    }

    this.isAdding.set(true);
    const newItem: ShoppingItem = {
      id: 0,
      name: this.addItemForm.value.name.trim(),
      store: this.addItemForm.value.store,
      quantity: this.addItemForm.value.quantity, // <-- ADD quantity from form
      bought: false,
      type: ItemType.GROCERY
    };

    this.shoppingService.addShoppingItem(newItem)
      .pipe(finalize(() => this.isAdding.set(false)))
      .subscribe({
        next: (addedItem) => {
          const newShoppingItem = {
            ...addedItem,
            quantity: addedItem.quantity === undefined || addedItem.quantity === null || addedItem.quantity < 1 ? 1 : addedItem.quantity
          };
          this.shoppingItems.update(items =>
            [...items, newShoppingItem].sort((a, b) => {
              const storeComparison = a.store.localeCompare(b.store);
              if (storeComparison !== 0) {
                return storeComparison;
              }
              return a.name.localeCompare(b.name);
            })
          );
          this.messageService.add({ severity: 'success', summary: 'Ajouté', detail: `"${newShoppingItem.name}" ajouté à la liste.` });
          this.addItemForm.reset({ store: Store.AUTRE, name: '', quantity: 1 }); // <-- RESET quantity
        },
        error: (err) => {
          console.error("Error adding shopping item:", err);
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'ajouter l\'article.' });
        }
      });
  }

  confirmDelete(event: Event, item: ShoppingItem): void {
    this.deleteItem(item);
  }

  deleteItem(item: ShoppingItem): void {
    this.shoppingService.deleteShoppingItem(item.id)
      .subscribe({
        next: () => {
          // No need to re-sort when removing
           this.loadItems();
          this.messageService.add({ severity: 'success', summary: 'Supprimé', detail: `"${item.name}" supprimé.` });
        },
        error: (err) => {
          console.error("Error deleting item:", err);
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer l\'article.' });
        }
      });
  }

  onQuantityChange(item: ShoppingItem, newQuantity: number | null): void {
    if (newQuantity === null || newQuantity < 1) {
      // If input is cleared or invalid, reset to 1 or previous valid quantity.
      // For simplicity, let's enforce 1 and update the backend.
      // The p-inputNumber's [min]="1" should prevent values below 1 if typed.
      // This handles programmatic changes or cleared input.
      newQuantity = 1; 
    }

    // Optimistically update the UI for responsiveness
    const originalQuantity = item.quantity;
    item.quantity = newQuantity; // ngModel would have updated this already
    
    this.shoppingItems.update(items => 
        items.map(i => i.id === item.id ? {...i, quantity: newQuantity!} : i)
    );

    this.shoppingService.updateQuantity(item.id, newQuantity)
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Quantité mise à jour', detail: `"${item.name}" quantité: ${newQuantity}.` });
        },
        error: (err) => {
          console.error("Error updating quantity:", err);
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: `Impossible de mettre à jour la quantité pour "${item.name}".` });
          // Revert optimistic update on error
          item.quantity = originalQuantity;
           this.shoppingItems.update(items => 
            items.map(i => i.id === item.id ? {...i, quantity: originalQuantity!} : i)
          );
          // Optionally, reload the specific item or the whole list to ensure data integrity
          // this.loadItems(); 
        }
      });
  }

  // --- Helpers ---
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

  // --- trackBy Function ---
  trackById(index: number, item: ShoppingItem): number {
    return item.id;
  }
}
