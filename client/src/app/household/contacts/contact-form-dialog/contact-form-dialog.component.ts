import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Contact } from '../../../model/contact';
import { ContactService } from '../../../service/contact.service';
import { SharedModule } from '../../../shared.module';
import { InputMaskModule } from 'primeng/inputmask';

@Component({
  selector: 'app-contact-form-dialog',
  standalone: true,
  imports: [
    SharedModule,
    ReactiveFormsModule,
    InputMaskModule
  ],
  providers: [MessageService],
  templateUrl: './contact-form-dialog.component.html',
})
export class ContactFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  private messageService = inject(MessageService);
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);

  contact: Contact | null = null;
  contactForm: FormGroup;
  isEditMode = false;

  ngOnInit(): void {
    this.contact = this.config.data?.contact;
    this.isEditMode = !!this.contact;

    this.contactForm = this.fb.group({
      name: [this.contact?.name || '', Validators.required],
      email: [this.contact?.email || '', [Validators.email]],
      phoneNumber: [this.contact?.phoneNumber || '', Validators.required],
    });
  }

  closeDialog(result?: any): void {
    this.ref.close(result);
  }

  saveContact(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const formValue = this.contactForm.value;
    let request$;

    if (this.isEditMode && this.contact) {
      request$ = this.contactService.update(this.contact.id, formValue);
    } else {
      request$ = this.contactService.create(formValue);
    }

    request$.subscribe({
      next: () => {
        const detail = this.isEditMode ? 'Contact updated' : 'Contact created';
        this.messageService.add({ severity: 'success', summary: 'Success', detail });
        this.closeDialog(true);
      },
      error: () => {
        const detail = `Failed to ${this.isEditMode ? 'update' : 'create'} contact.`;
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }
}