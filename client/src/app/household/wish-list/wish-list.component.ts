import { Component, computed, inject, OnInit, signal, WritableSignal, OnDestroy } from '@angular/core'; // Added OnDestroy
import { CommonModule } from '@angular/common';
// Removed FormBuilder, FormGroup, ReactiveFormsModule, Validators - they moved to dialog
import { finalize, Subject, takeUntil } from 'rxjs'; // Added Subject, takeUntil
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog'; // Import DialogService, DynamicDialogRef

import { SharedModule } from '../../shared.module'; 
import { HouseholdService } from '../../service/household.service';
import { AuthService } from '../../service/auth.service';
import { Household, HouseholdMember, Item, WayToCare } from '../../model/household';

// Import the new dialog component
import { AddEditWayToCareDialogComponent } from '../add-edit-way-to-care-dialog/add-edit-way-to-care-dialog.component';
import { WishListService } from '../../service/wish-list.service';

interface GroupedWishes {
  member: HouseholdMember;
  items: Item[];
}
@Component({
  selector: 'app-wish-list',
  imports: [CommonModule, SharedModule],
  templateUrl: './wish-list.component.html',
  styleUrl: './wish-list.component.css',
  providers: [ MessageService, ConfirmationService ]
})
export class WishListComponent {
 // --- Injected Services ---
 private wishListService = inject(WishListService);
 private householdService = inject(HouseholdService);
 private authService = inject(AuthService);
 private messageService = inject(MessageService);
 private confirmationService = inject(ConfirmationService);
 private dialogService = inject(DialogService); // Inject DialogService
 // Removed FormBuilder

 household: WritableSignal<Household | null> = signal(null);
 allItems = signal<Item[]>([]);
 currentUser: HouseholdMember | null = null;

 // --- REMOVED Dialog/Form State ---
 // displayDialog = signal(false);
 // isEditing = signal(false);
 // isSaving = signal(false);
 // selectedWayToCare = signal<WayToCare | null>(null);
 // wayToCareForm!: FormGroup;

 // --- Dynamic Dialog Ref ---
 dialogRef: DynamicDialogRef | undefined;
 private destroy$ = new Subject<void>(); // For unsubscribing

 // --- Computed Signal for Grouping (no changes needed) ---
 groupedWishes = computed<GroupedWishes[]>(() => {
   // ... (keep existing logic) ...
   const hh = this.household();
   const allItems = this.allItems();
   if (!hh || !hh.members) {
     return [];
   }
   return hh.members.map(member => ({
     member: member,
     items: allItems.filter(item => item.householdMember?.id === member.id)
                    .sort((a, b) => a.title.localeCompare(b.title))
   }));
 });

 // --- Lifecycle Hooks ---
 ngOnInit(): void {
   // Removed initializeForm() call
   this.loadInitialData();
 }

 ngOnDestroy(): void { // Implement OnDestroy
   this.destroy$.next();
   this.destroy$.complete();
   // Close any open dialogs when component is destroyed
   if (this.dialogRef) {
     this.dialogRef.close();
   }
 }

 // Removed initializeForm() method

 loadInitialData(): void { 
   this.householdService.retrieveHousehold()
     .pipe(takeUntil(this.destroy$)) // Unsubscribe on destroy
     .subscribe({
       next: (hh) => {
         this.household.set(hh);
         this.currentUser = hh?.currentUser ?? null; // Set current user ID
         if (hh) {
           this.loadWaysToCare();
         } 
       },
       error: (err) => {
         console.error("Error loading household data:", err);
         this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les informations du foyer.' });
       }
     });
 } 

 loadWaysToCare(): void {
   this.wishListService.retrieveWaysToCare()
     .pipe(takeUntil(this.destroy$)) // Unsubscribe on destroy
     .subscribe({
       next: (items) => {
         this.allItems.set(items); 
       },
       error: (err) => {
         console.error("Error retrieving Ways to Care:", err);
         this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les petites attentions.' });
       }
     });
 }

 openAddEditDialog(item: Item | null = null): void {
  this.dialogRef = this.dialogService.open(AddEditWayToCareDialogComponent, {
      header: item?.id ? 'Modifier le souhait' : 'Ajouter le souhait',
      width: '90%',
      modal: true,
      contentStyle: {"overflow": "auto"},
      data: { // Pass data to the dialog
          isEditing: item?.id ? true : false,
          labelThirdField: 'Lien',
          item: {
            ...item,
            location: item?.link || '',
          }
      }
  });
  this.dialogRef.onClose.pipe(takeUntil(this.destroy$)).subscribe((newItem?: any) => {  
    if(!newItem) return;
    const itemToCreateEdit: Omit<Item, 'householdMember'> = {
      id: newItem.id,
      title: newItem.title,
      description: newItem.description,
      cost: newItem.cost,
      link: newItem.location
    }
    const saveObservable = (itemToCreateEdit.id !== undefined && itemToCreateEdit.id && item?.householdMember)
    // Cast needed as ID is present and service expects full WayToCare for update
    ? this.wishListService.updateWishListItem(itemToCreateEdit as Item, item.householdMember)
    : this.wishListService.createWishListItem(itemToCreateEdit);
    saveObservable.subscribe({
      next: (savedItem) => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: `Attention ${item?.id ? 'mise à jour' : 'ajoutée'}.` });
        this.loadWaysToCare();
    }});
  })
}

 // --- Delete Handling (no changes needed) ---
 confirmDelete(event: Event, item: Item): void {
   // ... (keep existing logic) ...
   if (!this.isCurrentUser(item.householdMember.id) || item.id == null) return;
   this.confirmationService.confirm({
     target: event.target as EventTarget,
     message: `Êtes-vous sûr de vouloir supprimer "${item.title}" ?`,
     icon: 'pi pi-exclamation-triangle', acceptLabel: 'Oui', rejectLabel: 'Non',
     accept: () => { this.deleteWishListItem(item.id!); }
   });
 }

 deleteWishListItem(id: number): void {
   // ... (keep existing logic) ...
   this.wishListService.deleteWishListItem(id).subscribe({
     next: () => {
       this.messageService.add({ severity: 'info', summary: 'Supprimé', detail: 'Petite attention supprimée.' });
       this.allItems.update(items => items.filter(i => i.id !== id));
     },
     error: (err) => {
       console.error(`Error deleting Way to Care ${id}:`, err);
       this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer la petite attention.' });
     }
   });
 }

 // --- Helpers (no changes needed) ---
 isCurrentUser(memberId: number): boolean {
   return this.currentUser?.id === memberId;
 }

 // --- trackBy Functions (no changes needed) ---
 trackByMemberId(index: number, group: GroupedWishes): number {
   return group.member.id;
 }
 trackByItemId(index: number, item: Item): number | undefined {
   return item.id;
 }
}
