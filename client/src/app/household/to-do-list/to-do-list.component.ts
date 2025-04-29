// c:\Users\Felix\Documents\Projects\couple-task-manager\client\src\app\household\to-do-list\to-do-list.component.ts
import { Component, computed, inject, signal, WritableSignal } from '@angular/core'; // Add WritableSignal
import { ToDoItem, ToDoStatus } from '../../model/household';
import { ToDoListService } from '../../service/to-do-list.service';
import { AddToDoDialogComponent } from '../add-to-do-dialog/add-to-do-dialog.component';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CheckboxChangeEvent } from 'primeng/checkbox';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs';
import { SharedModule } from '../../shared.module';
// Import CommonModule if not exported by SharedModule
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// Import RatingModule if not in SharedModule
import { RatingModule } from 'primeng/rating';
import { DialogModule } from 'primeng/dialog'; // Import DialogModule

@Component({
  selector: 'app-to-do-list',
  imports: [
    CommonModule, // Ensure CommonModule is imported for pipes/directives
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    DialogModule  // Add DialogModule
  ],
  templateUrl: './to-do-list.component.html',
  styleUrl: './to-do-list.component.css',
  providers: [MessageService, ConfirmationService],
})
export class ToDoListComponent {
  private toDoListService = inject(ToDoListService);
  private dialogService = inject(DialogService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService); 
  isUpdating = signal<number | null>(null);
  allItems = signal<ToDoItem[]>([]);
  dialogRef: DynamicDialogRef | undefined;

  // --- Sort State Signal ---
  costSortDirection = signal<'asc' | 'desc' | 'none'>('none');

  // --- Rating Dialog State ---
  displayRatingDialog = signal(false);
  itemToRate: WritableSignal<ToDoItem | null> = signal(null);
  ratingValue: WritableSignal<number | null> = signal(null);
  isSubmittingRating = signal(false);
  // --- End Rating Dialog State ---

  // --- Computed Signals ---
  completedItems = computed(() => this.allItems().filter(item => item.status === ToDoStatus.COMPLETED));
  pendingItems = computed(() => {
    const items = this.allItems().filter(item => item.status === ToDoStatus.TO_DO);
    const sortDir = this.costSortDirection();
    if (sortDir === 'asc') return [...items].sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0));
    if (sortDir === 'desc') return [...items].sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0));
    return items; // Default sort (title) is applied in loadItems
  });
  costSortIcon = computed(() => {
    const dir = this.costSortDirection();
    if (dir === 'asc') return 'pi pi-sort-amount-up';
    if (dir === 'desc') return 'pi pi-sort-amount-down';
    return 'pi pi-sort-alt';
  });
  costSortTooltip = computed(() => {
    const dir = this.costSortDirection();
    if (dir === 'asc') return 'Trier par coût (croissant)';
    if (dir === 'desc') return 'Trier par coût (décroissant)';
    return 'Trier par coût';
  });
  // --- End Computed Signals ---

  ToDoStatus = ToDoStatus;

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void { 
    this.toDoListService.retrieveToDoItems() 
      .subscribe({
        next: (toDoItems) => {
          const validItems = toDoItems.filter(item => {
            const isValid = item.id != null;
            if (!isValid) console.error("INVALID ITEM DETECTED (Missing ID):", item);
            return isValid;
          });
          if (validItems.length !== toDoItems.length) {
             this.messageService.add({ severity: 'warn', summary: 'Données Invalides', detail: 'Certaines tâches reçues du serveur manquaient d\'un ID et ont été ignorées.', life: 5000 });
          }
          // Default Sort: Status then Title
          this.allItems.set(validItems.sort((a, b) => {
            if (a.status !== b.status) return a.status === ToDoStatus.TO_DO ? -1 : 1;
            return a.title.localeCompare(b.title);
          }));
        },
        error: (error) => {
          console.error('Error retrieving ToDo items:', error);
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger la liste.' });
        }
      });
  }

  toggleCostSort(): void {
    this.costSortDirection.update(current => {
      if (current === 'none') return 'asc';
      if (current === 'asc') return 'desc';
      return 'none';
    });
     // Optional: Add feedback toast
     this.messageService.add({
        severity: 'info',
        summary: 'Tri',
        detail: `Tri par coût: ${this.costSortDirection() === 'asc' ? 'Croissant' : this.costSortDirection() === 'desc' ? 'Décroissant' : 'Désactivé'}`,
        life: 1500
    });
  }

  handleStatusChange(item: ToDoItem, event: CheckboxChangeEvent): void {
    const isCompleting = event.checked;

    if ((this.isUpdating() !== null && this.isUpdating() === item.id) || !item.id) {
        console.warn(`Update prevented for item ${item.id}. Currently updating: ${this.isUpdating()}`);
        return;
    }

    if (isCompleting) {
      // Open Rating Dialog (no change needed here)
      this.itemToRate.set(item);
      this.ratingValue.set(null);
      this.displayRatingDialog.set(true);
    } else {
      // Un-completing: Call service directly
      console.log(`Proceeding with status update for item ${item.id} to TO_DO`);
      this.isUpdating.set(item.id);
      this.toDoListService.updateToDoItemStatus(item.id!, ToDoStatus.TO_DO)
        .pipe(finalize(() => {
            console.log(`Finalizing update for item ${item.id}. Resetting isUpdating.`);
            this.isUpdating.set(null);
        }))
        .subscribe({
          next: () => {
            console.log(`Successfully updated status for item ${item.id} to TO_DO`);
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: `Statut de "${item.title}" mis à jour.` });

            // --- MODIFICATION: Update local state, clearing rating ---
            this.allItems.update(items => items.map(i =>
              i.id === item.id ? { ...i, status: ToDoStatus.TO_DO, rating: null } : i // Set rating to null
            ).sort((a, b) => { // Re-apply base sort
              if (a.status !== b.status) return a.status === ToDoStatus.TO_DO ? -1 : 1;
              return a.title.localeCompare(b.title);
            }));
            // --- END MODIFICATION ---

          },
          error: (err) => {
            console.error(`Error updating status for item ${item.id}:`, err);
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de mettre à jour le statut.' });
            this.loadItems();
          }
        });
    }
  }

  // --- NEW: Rating Dialog Actions ---
  submitRating(): void {
    const rating = this.ratingValue();
    const item = this.itemToRate();

    // --- Keep validation as is ---
    if (rating === null || rating === 0 || !item || !item.id) {
      this.messageService.add({ severity: 'warn', summary: 'Note Invalide', detail: 'Veuillez sélectionner une note (1-10 étoiles).' });
      return;
    }

    console.log(`Submitting rating ${rating} for item ${item.id}`);
    this.isSubmittingRating.set(true);

    this.toDoListService.rateAndCompleteToDoItem(item.id, rating) // Use the correct service method name
      .pipe(finalize(() => {
        console.log(`Finalizing rating submission for item ${item.id}.`);
        this.isSubmittingRating.set(false);
      }))
      .subscribe({
        next: () => {
          console.log(`Successfully completed item ${item.id} with rating ${rating}`);
          this.messageService.add({ severity: 'success', summary: 'Terminé!', detail: `"${item.title}" marqué comme terminé avec une note de ${rating}/10.` });

          // --- MODIFICATION: Update local state INCLUDING rating ---
          this.allItems.update(items => items.map(i =>
            i.id === item.id ? { ...i, status: ToDoStatus.COMPLETED, rating: rating } : i // Add rating here
          ).sort((a, b) => { // Re-apply base sort
            if (a.status !== b.status) return a.status === ToDoStatus.TO_DO ? -1 : 1;
            return a.title.localeCompare(b.title);
          }));
          // --- END MODIFICATION ---

          this.closeRatingDialog(); // Close dialog on success
        },
        error: (err) => {
          console.error(`Error submitting rating for item ${item.id}:`, err);
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de soumettre la note.' });
        }
      });
  }

  cancelRating(): void {
    console.log("Rating cancelled.");
    const itemToRevert = this.itemToRate();
    if (itemToRevert) {
      // Revert the status in the main list to visually uncheck the box
      this.allItems.update(items => items.map(i =>
        i.id === itemToRevert.id ? { ...i, status: ToDoStatus.TO_DO } : i
      ));
      console.log(`Reverted status for item ${itemToRevert.id} to TO_DO`);
    }
    this.closeRatingDialog();
  }

  closeRatingDialog(): void {
    this.displayRatingDialog.set(false);
    this.itemToRate.set(null);
    this.ratingValue.set(null);
    this.isSubmittingRating.set(false); // Ensure this is reset
  }
  // --- END Rating Dialog Actions ---

  openAddDialog(): void {
    this.dialogRef = this.dialogService.open(AddToDoDialogComponent, {
      header: 'Ajouter une Tâche', width: '90%', modal: true,
      contentStyle: {"overflow": "auto"}, baseZIndex: 10000
    });
    this.dialogRef.onClose.subscribe((newItem?: ToDoItem) => {
      if (newItem && newItem.id != null) {
        this.allItems.update(items =>
          [...items, newItem].sort((a, b) => {
            if (a.status !== b.status) return a.status === this.ToDoStatus.TO_DO ? -1 : 1;
            return a.title.localeCompare(b.title);
          })
        );
      } else if (newItem) {
        console.error('Received new item from dialog, but it lacks a valid ID:', newItem);
        this.messageService.add({ severity: 'error', summary: 'Erreur Interne', detail: 'La nouvelle tâche a été créée mais n\'a pas pu être ajoutée à la liste locale (ID manquant). Veuillez rafraîchir.', life: 5000 });
        this.loadItems();
      }
    });
  }

  confirmDelete(event: Event, item: ToDoItem): void {
    if (item.id == null) return;
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Êtes-vous sûr de vouloir supprimer "${item.title}" ?`,
      icon: 'pi pi-exclamation-triangle', acceptLabel: 'Oui', rejectLabel: 'Non',
      accept: () => { this.deleteItem(item); }
    });
  }

  deleteItem(item: ToDoItem): void {
    if (item.id == null) return;
    this.toDoListService.deleteToDoItem(item.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'info', summary: 'Supprimé', detail: `"${item.title}" a été supprimé.` });
        this.allItems.update(items => items.filter(i => i.id !== item.id));
      },
      error: (err) => {
        console.error(`Error deleting item ${item.id}:`, err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer la tâche.' });
      }
    });
  }

  trackById(index: number, item: ToDoItem): number | undefined {
    return item.id;
  }
}
