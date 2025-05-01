import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs';
import { ToDoItem, ToDoStatus } from '../../model/household';
import { ToDoListService } from '../../service/to-do-list.service';
import { SharedModule } from '../../shared.module';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-add-to-do-dialog',
  imports: [SharedModule, ReactiveFormsModule,InputNumberModule],
  templateUrl: './add-to-do-dialog.component.html',
  styleUrl: './add-to-do-dialog.component.css',
  providers: [MessageService]
})
export class AddToDoDialogComponent {
  private fb = inject(FormBuilder);
  private ref = inject(DynamicDialogRef);
  private toDoListService = inject(ToDoListService);
  private messageService = inject(MessageService);

  addToDoForm!: FormGroup;
  isSaving = false;

  ngOnInit(): void {
    this.addToDoForm = this.fb.group({
      title: ['', Validators.required],
      description: [''], // Optional
      cost: [null],      // Optional, default to null or 0
      location: ['']     // Optional
    });
    
  }

  get title() { return this.addToDoForm.get('title'); }

  saveToDoItem(): void {
    this.addToDoForm.markAllAsTouched();
    if (this.addToDoForm.invalid) {
      return;
    }

    this.isSaving = true;
    const formValue = this.addToDoForm.value;

    // --- FIX IS HERE ---
    const newToDoItem: ToDoItem = {
      // id will be assigned by the backend
      title: formValue.title.trim(),
      description: formValue.description?.trim() || '', // Ensure empty string if null/undefined
      cost: formValue.cost ?? 0, // Default cost to 0 if null
      location: formValue.location?.trim() || '', // Ensure empty string
      status: ToDoStatus.TO_DO, // New items always start as TO_DO
      rating: null // <-- ADD THIS LINE
    };
    // --- END FIX ---

    this.toDoListService.createToDoItem(newToDoItem)
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: (createdItem) => {
          this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Nouvelle tâche ajoutée.' });
          this.ref.close(createdItem); // Close dialog and return the new item
        },
        error: (err) => {
          console.error("Error creating ToDo item:", err);
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'ajouter la tâche.' });
        }
      });
  }


  closeDialog(): void {
    this.ref.close(); // Close without returning data
  }
}
