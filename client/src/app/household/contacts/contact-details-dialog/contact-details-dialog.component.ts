import { Component, OnInit, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SharedModule } from '../../../shared.module';
import { Contact, Transaction } from '../../../model/contact';
import { ContactService } from '../../../service/contact.service';
import { TransactionFormDialogComponent } from '../transaction-form-dialog/transaction-form-dialog.component';

@Component({
  selector: 'app-contact-details-dialog',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './contact-details-dialog.component.html',
})
export class ContactDetailsDialogComponent implements OnInit {
  private config = inject(DynamicDialogConfig);
  private dialogService = inject(DialogService);
  private ref = inject(DynamicDialogRef);
  private confirmationService = inject(ConfirmationService);
  private contactService = inject(ContactService);
  private messageService = inject(MessageService);

  contact!: Contact;
  private transactionDialogRef: DynamicDialogRef | undefined;

  ngOnInit(): void {
    this.contact = this.config.data.contact;
  }

  openAddEditTransactionDialog(transaction?: Transaction): void {
    const isEdit = !!transaction;
    this.transactionDialogRef = this.dialogService.open(TransactionFormDialogComponent, {
      header: isEdit ? 'Edit Transaction' : 'Add a New Transaction',
      width: '35rem',
      data: {
        contactId: this.contact.id,
        transaction: transaction,
      },
      modal: true,
      dismissableMask: true,
    });

    this.transactionDialogRef.onClose.subscribe((wasSuccessful) => {
      if (wasSuccessful) {
        this.ref.close(true);
      }
    });
  }

  confirmDelete(event: Event, transaction: Transaction): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure you want to delete this transaction?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteTransaction(transaction.id),
    });
  }

  private deleteTransaction(id: number): void {
    // Assumes a method like `deleteTransaction` exists on your ContactService
    this.contactService.deleteTransaction(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Transaction deleted' });
        this.ref.close(true);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete transaction' });
      },
    });
  }

  trackByTransactionId(index: number, transaction: Transaction): number {
    return transaction.id;
  }
}