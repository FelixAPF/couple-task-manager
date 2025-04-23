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
  isLoading = signal(true);
  isAdding = signal(false);
  storeOptions: SelectItem[] = [];
  nameSuggestions: string[] = [];

  // --- Add Item Form ---
  addItemForm: FormGroup;

  constructor() {
    this.addItemForm = this.fb.group({
      name: ['', Validators.required],
      store: [Store.AUTRE, Validators.required]
    });
  }

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    this.loadItems();
    this.loadStoreOptions();
  }

  // --- Data Loading ---
  loadItems(): void {
    this.isLoading.set(true);
    this.shoppingService.retrieveShoppingListNotBought()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (items) => {
          // --- SORTING LOGIC UPDATED HERE ---
          this.shoppingItems.set(items.sort((a, b) => {
            const storeComparison = a.store.localeCompare(b.store); // Compare stores first
            if (storeComparison !== 0) {
              return storeComparison; // Return if stores are different
            }
            return a.name.localeCompare(b.name); // Otherwise, compare by name
          }));
          // --- END SORTING LOGIC ---
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
      bought: false,
      type: ItemType.GROCERY
    };

    this.shoppingService.addShoppingItem(newItem)
      .pipe(finalize(() => this.isAdding.set(false)))
      .subscribe({
        next: (addedItem) => {
          // --- SORTING LOGIC ADDED HERE ---
          this.shoppingItems.update(items =>
            [...items, addedItem].sort((a, b) => { // Add the new item and re-sort
              const storeComparison = a.store.localeCompare(b.store);
              if (storeComparison !== 0) {
                return storeComparison;
              }
              return a.name.localeCompare(b.name);
            })
          );
          // --- END SORTING LOGIC ---
          this.messageService.add({ severity: 'success', summary: 'Ajouté', detail: `"${addedItem.name}" ajouté à la liste.` });
          this.addItemForm.reset({ store: Store.AUTRE, name: '' });
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
