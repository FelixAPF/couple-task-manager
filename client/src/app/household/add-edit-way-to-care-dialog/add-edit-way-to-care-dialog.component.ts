// c:\Users\Felix\Documents\Projects\couple-task-manager\client\src\app\household\add-edit-way-to-care-dialog\add-edit-way-to-care-dialog.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';

// Import necessary modules directly for standalone component
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module'; // For PrimeNG components like pInputText, pButton etc.

import { WayToCare } from '../../model/household';
import { WaysToCareService } from '../../service/ways-to-care.service';

@Component({
  selector: 'app-add-edit-way-to-care-dialog',
  standalone: true,
  // Import modules needed by the template
  imports: [ CommonModule, SharedModule, ReactiveFormsModule ],
  templateUrl: './add-edit-way-to-care-dialog.component.html',
  styleUrls: ['./add-edit-way-to-care-dialog.component.css'],
  providers: [MessageService] // Provide if not global
})
export class AddEditWayToCareDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  public ref = inject(DynamicDialogRef); // Make public if needed in template (usually not)
  public config = inject(DynamicDialogConfig); // Make public if needed in template
  private waysToCareService = inject(WaysToCareService);
  private messageService = inject(MessageService);

  wayToCareForm!: FormGroup;
  isEditing = false;
  isSaving = false;
  currentItemId: number | undefined;

  ngOnInit(): void {
    this.isEditing = this.config.data?.isEditing ?? false;
    const itemToEdit: WayToCare | null = this.config.data?.item;
    this.currentItemId = itemToEdit?.id;

    this.initializeForm();

    if (this.isEditing && itemToEdit) {
      this.wayToCareForm.patchValue({
        title: itemToEdit.title,
        description: itemToEdit.description,
        cost: itemToEdit.cost,
        location: itemToEdit.location
      });
    }
  }

  initializeForm(): void {
    this.wayToCareForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      cost: [null], // Default to null, handle 0 in save
      location: ['']
    });
  }

  get title() { return this.wayToCareForm.get('title'); }

  saveWayToCare(): void {
    this.wayToCareForm.markAllAsTouched();
    if (this.wayToCareForm.invalid) {
      return;
    }

    this.isSaving = true;
    const formValue = this.wayToCareForm.value;

    // Prepare data, including ID only if editing
    const wayToCareData: Omit<WayToCare, 'assignee'> & { id?: number } = {
      id: this.isEditing ? this.currentItemId : undefined,
      title: formValue.title.trim(),
      description: formValue.description?.trim() || '',
      cost: formValue.cost ?? 0,
      location: formValue.location?.trim() || ''
    };

    const saveObservable = this.isEditing
      // Cast needed as ID is present and service expects full WayToCare for update
      ? this.waysToCareService.updateWayToCare(wayToCareData as WayToCare, this.config.data.item.assignee)
      // Pass data without ID/Assignee for creation
      : this.waysToCareService.createWayToCare(wayToCareData);

    saveObservable
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: (savedItem) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: `Petite attention ${this.isEditing ? 'mise à jour' : 'ajoutée'}.`
          });
          // Close the dialog and pass back the saved item
          this.ref.close(savedItem);
        },
        error: (err) => {
          console.error("Error saving Way to Care:", err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: `Impossible de ${this.isEditing ? 'mettre à jour' : 'sauvegarder'} la petite attention.`
          });
          // Keep dialog open on error
        }
      });
  }

  closeDialog(): void {
    // Close without passing data (cancel)
    this.ref.close();
  }
}
