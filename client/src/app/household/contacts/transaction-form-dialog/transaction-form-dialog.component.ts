import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CalendarModule } from 'primeng/calendar';
import { ContactService } from '../../../service/contact.service';
import { SharedModule } from '../../../shared.module';
import { Transaction } from '../../../model/contact'; // Assuming you have this model

@Component({
  selector: 'app-transaction-form-dialog',
  standalone: true,
  imports: [
    SharedModule,
    ReactiveFormsModule,
    CalendarModule
  ],
  templateUrl: './transaction-form-dialog.component.html',
  providers: [MessageService]
})
export class TransactionFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  private messageService = inject(MessageService);
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);

  transactionForm: FormGroup;
  isEditMode = false;
  private transactionToEdit: Transaction | null = null;
  private contactId!: number;

  ngOnInit(): void {
    this.transactionToEdit = this.config.data?.transaction;
    this.contactId = this.config.data.contactId;
    this.isEditMode = !!this.transactionToEdit;

    this.transactionForm = this.fb.group({
      description: [this.transactionToEdit?.description || '', Validators.required],
      amount: [this.transactionToEdit?.amount || null, [Validators.required, Validators.min(0.01)]],
      date: [this.transactionToEdit ? new Date(this.transactionToEdit.date) : new Date(), Validators.required],
      note: [this.transactionToEdit?.note || ''],
    });
  }

  closeDialog(result = false): void {
    this.ref.close(result);
  }

  saveTransaction(): void {
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    const formValue = { ...this.transactionForm.value };
    let request$;

    if (this.isEditMode && this.transactionToEdit) {
      // Assumes a method like `updateTransaction` exists on your ContactService
      request$ = this.contactService.updateTransaction(this.contactId, this.transactionToEdit.id, formValue);
    } else {
      // Uses your existing method for adding a new transaction
      request$ = this.contactService.addTransaction(this.contactId, formValue);
    }

    request$.subscribe({
      next: () => {
        const detail = this.isEditMode ? 'Transaction updated' : 'Transaction added';
        this.messageService.add({ severity: 'success', summary: 'Success', detail });
        this.closeDialog(true);
      },
      error: () => {
        const detail = `Failed to ${this.isEditMode ? 'update' : 'add'} transaction.`;
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }
}