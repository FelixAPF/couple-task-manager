import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { RippleModule } from 'primeng/ripple';
import { ContactService } from '../../service/contact.service';
import { Contact, Transaction } from '../../model/contact';
import { ContactFormDialogComponent } from './contact-form-dialog/contact-form-dialog.component';
import { ContactDetailsDialogComponent } from './contact-details-dialog/contact-details-dialog.component';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [
    SharedModule,
    RippleModule
  ],
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService, MessageService],
  animations: [
    trigger('inOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(15px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
    ])
  ]
})
export class ContactsComponent implements OnInit, OnDestroy {
  private contactService = inject(ContactService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);

  dialogRef: DynamicDialogRef | undefined;
  
  contacts = signal<Contact[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadContacts();
  }

  loadContacts(): void {
    this.isLoading.set(true);
    this.contactService.retrieveList().subscribe({
      next: (data) => {
        this.contacts.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load contacts.' });
        this.isLoading.set(false);
      }
    });
  }

  showContactDetails(contact: Contact): void {
    this.dialogRef = this.dialogService.open(ContactDetailsDialogComponent, {
      header: `Details for ${contact.name}`,
      width: '50rem',
      data: { contact },
      modal: true,
      dismissableMask: true
    });

    this.dialogRef.onClose.subscribe((wasSuccessful) => {
      if (wasSuccessful) {
        this.loadContacts();
      }
    });
  }
  
  openAddEditDialog(contact?: Contact): void {
    const isEdit = !!contact;
    this.dialogRef = this.dialogService.open(ContactFormDialogComponent, {
      header: isEdit ? 'Edit Contact' : 'Add New Contact',
      width: '30rem',
      data: { contact },
      modal: true,
      dismissableMask: true
    });

    this.dialogRef.onClose.subscribe((result) => {
      if (result) {
        this.loadContacts();
      }
    });
  }

  confirmDelete(event: Event, contact: Contact): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to delete ${contact.name}?`,
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteContact(contact.id),
    });
  }

  private deleteContact(id: number): void {
    this.contactService.delete(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Contact deleted successfully.' });
        this.loadContacts();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete contact.' });
      }
    });
  }

  trackByContactId(index: number, contact: Contact): number {
    return contact.id;
  }

  ngOnDestroy(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}