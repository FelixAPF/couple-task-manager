import { Component, inject, signal } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { HouseholdService } from '../../service/household.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-join-household',
  imports: [SharedModule, ReactiveFormsModule],
  templateUrl: './join-household.component.html',
  styleUrl: './join-household.component.css',
  providers: [MessageService]
})
export class JoinHouseholdComponent {
  private fb = inject(FormBuilder);
  private householdService = inject(HouseholdService);
  private messageService = inject(MessageService);
  private ref = inject(DynamicDialogRef);

  isLoading = signal(false);

  // --- Form ---
  joinForm = this.fb.group({
    joinKey: ['', [Validators.required, Validators.minLength(36)]] // Add minLength or other validation if known
  });

  get joinKey() { return this.joinForm.get('joinKey'); }

  // --- Methods ---
  onSubmit(): void {
    this.joinForm.markAllAsTouched();
    if (this.joinForm.invalid) {
      this.messageService.add({
        severity: 'warn', summary: 'Validation Error',
        detail: 'Veuillez entrer un code de foyer valide.', life: 3000
      });
      return;
    }

    this.isLoading.set(true);
    const key = this.joinKey?.value;

    if (!key) { // Should be caught by validation, but good practice
        this.isLoading.set(false);
        return;
    }

    this.householdService.joinHousehold(key)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (household) => {
          this.messageService.add({
            severity: 'success', summary: 'Succès',
            detail: `Vous avez rejoint le foyer "${household.name}"!`, life: 3000
          });
          // Close the dialog on success, passing 'true' indicates success
          this.ref.close(true);
        },
        error: (err) => {
          console.error('Failed to join household:', err);
          this.messageService.add({
            severity: 'error', summary: 'Échec',
            detail: err?.error?.message || 'Impossible de rejoindre le foyer. Vérifiez le code et réessayez.', life: 5000
          });
          // Keep the dialog open on error
        }
      });
  }

  // Optional: Method to close dialog without submitting
  closeDialog(): void {
    this.ref.close();
  }
}
