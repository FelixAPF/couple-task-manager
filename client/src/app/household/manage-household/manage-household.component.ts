// c:\Users\Felix\Documents\Projects\couple-task-manager\client\src\app\household\manage-household\manage-household.component.ts
import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil, finalize } from 'rxjs';

// PrimeNG Modules
import { SharedModule } from '../../shared.module';
// Import FileUpload class and specific event types
import { FileUpload, FileUploadModule, FileSelectEvent } from 'primeng/fileupload'; // Use FileSelectEvent
import { MessageService } from 'primeng/api';

// App Services & Models
import { HouseholdService } from '../../service/household.service';
import { Household, HouseholdMember } from '../../model/household';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner'; // Import ProgressSpinnerModule

@Component({
  selector: 'app-manage-household',
  standalone: true,
  imports: [
    ToastModule,
    AvatarModule,
    CommonModule,
    SharedModule,
    FileUploadModule,
    ProgressSpinnerModule // Add ProgressSpinnerModule
  ],
  templateUrl: './manage-household.component.html',
  styleUrls: ['./manage-household.component.css'],
  providers: [MessageService]
})
export class ManageHouseholdComponent implements OnInit, OnDestroy {
  // --- Injected Services ---
  private householdService = inject(HouseholdService);
  private messageService = inject(MessageService);

  // --- State ---
  household$: Observable<Household | null>;
  isLoading = signal(false);
  uploadingMemberId = signal<number | null>(null);
  // Store selected files temporarily, mapped by member ID
  selectedFiles: { [memberId: number]: File } = {};
  private destroy$ = new Subject<void>();

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    this.household$ = this.householdService.household$; // Use correct observable name
    // Ensure household data is loaded if not already present
    if (!this.householdService.getCurrentHousehold()) { // Use correct method name
      this.isLoading.set(true);
      this.householdService.retrieveHousehold() // Use correct method name
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isLoading.set(false))
        )
        .subscribe({
            error: (err) => {
                console.error("Error loading household", err);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les informations du foyer.' });
            }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Event Handlers ---

  /**
   * Stores the selected file when the user chooses one.
   * @param event The FileSelectEvent containing the selected file(s).
   * @param memberId The ID of the member the file is for.
   */
  onFileSelect(event: FileSelectEvent, memberId: number): void {
    if (event.files && event.files.length > 0) {
      this.selectedFiles[memberId] = event.files[0];
    } else {
      // Clear if selection was cancelled or empty
      delete this.selectedFiles[memberId];
    }
  }

  /**
   * Triggers the actual upload process for the selected file.
   * @param memberId The ID of the member whose image is being uploaded.
   * @param uploader Optional: Reference to the FileUpload component to clear it.
   */
  triggerImageUpload(memberId: number, uploader?: FileUpload): void {
    const fileToUpload = this.selectedFiles[memberId];

    if (!fileToUpload) {
      this.messageService.add({ severity: 'warn', summary: 'Aucun fichier', detail: 'Veuillez d\'abord choisir un fichier.', life: 3000 });
      return;
    }

    this.uploadingMemberId.set(memberId); // Set loading state

    this.householdService.updateMemberImage(memberId, fileToUpload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
            this.uploadingMemberId.set(null); // Clear loading state
            delete this.selectedFiles[memberId]; // Clear selected file after attempt
            uploader?.clear(); // Clear the FileUpload component UI
        })
      )
      .subscribe({
        next: (result) => {
          this.messageService.add({
            severity: 'success', summary: 'Succès',
            detail: `Image mise à jour.`, life: 3000
          });
          // No need to call uploader.clear() here, finalize does it
        },
        error: (err) => {
          console.error(`Error uploading image for member ${memberId}:`, err);
          this.messageService.add({
            severity: 'error', summary: 'Échec Upload',
            detail: err?.error?.message || "Impossible de mettre à jour l'image.", life: 5000
          });
          // No need to call uploader.clear() here, finalize does it
        }
      });
  }

  // --- trackBy Function ---
  trackByMemberId(index: number, member: HouseholdMember): number {
    return member.id;
  }
}
