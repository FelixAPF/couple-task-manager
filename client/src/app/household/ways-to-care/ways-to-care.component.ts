// c:\Users\Felix\Documents\Projects\couple-task-manager\client\src\app\household\ways-to-care\ways-to-care.component.ts
import { Component, computed, inject, OnInit, signal, WritableSignal, OnDestroy } from '@angular/core'; // Added OnDestroy
import { CommonModule } from '@angular/common';
// Removed FormBuilder, FormGroup, ReactiveFormsModule, Validators - they moved to dialog
import { finalize, Subject, takeUntil } from 'rxjs'; // Added Subject, takeUntil
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog'; // Import DialogService, DynamicDialogRef

import { SharedModule } from '../../shared.module';
import { WaysToCareService } from '../../service/ways-to-care.service';
import { HouseholdService } from '../../service/household.service';
import { AuthService } from '../../service/auth.service';
import { Household, HouseholdMember, WayToCare } from '../../model/household';

// Import the new dialog component
import { AddEditWayToCareDialogComponent } from '../add-edit-way-to-care-dialog/add-edit-way-to-care-dialog.component';

interface GroupedWaysToCare {
  member: HouseholdMember;
  items: WayToCare[];
}

@Component({
  selector: 'app-ways-to-care',
  standalone: true,
  // Removed ReactiveFormsModule from imports
  imports: [ CommonModule, SharedModule ],
  templateUrl: './ways-to-care.component.html',
  styleUrls: ['./ways-to-care.component.css'],
  // Add DialogService to providers
  providers: [ MessageService, ConfirmationService ]
})
export class WaysToCareComponent implements OnInit, OnDestroy { // Implement OnDestroy
  // --- Injected Services ---
  private waysToCareService = inject(WaysToCareService);
  private householdService = inject(HouseholdService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private dialogService = inject(DialogService); // Inject DialogService
  // Removed FormBuilder

  // --- State Signals ---
  isLoading = signal(true);
  household: WritableSignal<Household | null> = signal(null);
  allWaysToCare = signal<WayToCare[]>([]);
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
  groupedWaysToCare = computed<GroupedWaysToCare[]>(() => {
    // ... (keep existing logic) ...
    const hh = this.household();
    const allItems = this.allWaysToCare();
    if (!hh || !hh.members) {
      return [];
    }
    return hh.members.map(member => ({
      member: member,
      items: allItems.filter(item => item.assignee?.id === member.id)
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
    this.isLoading.set(true);
    this.householdService.retrieveHousehold()
      .pipe(takeUntil(this.destroy$)) // Unsubscribe on destroy
      .subscribe({
        next: (hh) => {
          this.household.set(hh);
          this.currentUser = hh?.currentUser ?? null; // Set current user ID
          if (hh) {
            this.loadWaysToCare();
          } else {
            this.isLoading.set(false);
          }
        },
        error: (err) => {
          console.error("Error loading household data:", err);
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les informations du foyer.' });
          this.isLoading.set(false);
        }
      });
  } 

  loadWaysToCare(): void {
    this.waysToCareService.retrieveWaysToCare()
      .pipe(takeUntil(this.destroy$)) // Unsubscribe on destroy
      .subscribe({
        next: (items) => {
          this.allWaysToCare.set(items);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error("Error retrieving Ways to Care:", err);
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les petites attentions.' });
          this.isLoading.set(false);
        }
      });
  }

  // --- MODIFIED Dialog Openers ---
  openAddDialog(): void {
    this.dialogRef = this.dialogService.open(AddEditWayToCareDialogComponent, {
        header: 'Ajouter une Attention',
        width: '90%',
        modal: true,
        contentStyle: {"overflow": "auto"},
        data: { // Pass data to the dialog
            isEditing: false
        }
    });

    this.dialogRef.onClose
      .pipe(takeUntil(this.destroy$)) // Unsubscribe on destroy
      .subscribe((newItem?: WayToCare) => {
        if (newItem) {
            console.log('Adding new item received from dialog:', newItem);
            // Add the new item (backend should have added assignee info)
            this.allWaysToCare.update(items =>
                [...items, newItem].sort((a, b) => a.title.localeCompare(b.title)) // Optional sort
            );
        }
    });
  }

  openEditDialog(item: WayToCare): void {
    if (!this.isCurrentUser(item.assignee.id)) return;

    this.dialogRef = this.dialogService.open(AddEditWayToCareDialogComponent, {
        header: 'Modifier l\'Attention',
        width: '90%',
        modal: true,
        contentStyle: {"overflow": "auto"},
        data: { // Pass data to the dialog
            isEditing: true,
            item: item // Pass the item being edited
        }
    });

    this.dialogRef.onClose
      .pipe(takeUntil(this.destroy$)) // Unsubscribe on destroy
      .subscribe((updatedItem?: WayToCare) => {
        if (updatedItem) {
            console.log('Updating item received from dialog:', updatedItem);
            // Update the item in the list
            this.allWaysToCare.update(items =>
                items.map(i => i.id === updatedItem.id ? updatedItem : i)
                     .sort((a, b) => a.title.localeCompare(b.title)) // Optional sort
            );
        }
    });
  }

  // --- REMOVED Methods (moved to dialog component) ---
  // closeDialog(): void { ... }
  // saveWayToCare(): void { ... }

  // --- Delete Handling (no changes needed) ---
  confirmDelete(event: Event, item: WayToCare): void {
    // ... (keep existing logic) ...
    if (!this.isCurrentUser(item.assignee.id) || item.id == null) return;
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Êtes-vous sûr de vouloir supprimer "${item.title}" ?`,
      icon: 'pi pi-exclamation-triangle', acceptLabel: 'Oui', rejectLabel: 'Non',
      accept: () => { this.deleteWayToCare(item.id!); }
    });
  }

  deleteWayToCare(id: number): void {
    // ... (keep existing logic) ...
    this.waysToCareService.deleteWayToCare(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'info', summary: 'Supprimé', detail: 'Petite attention supprimée.' });
        this.allWaysToCare.update(items => items.filter(i => i.id !== id));
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
  trackByMemberId(index: number, group: GroupedWaysToCare): number {
    return group.member.id;
  }
  trackByItemId(index: number, item: WayToCare): number | undefined {
    return item.id;
  }
}
