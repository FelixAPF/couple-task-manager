import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { TravelService, TravelTemplateItem } from '../../../services/travel.service';
import { HouseholdService } from '../../../household.service';
import { SharedModule } from '../../../../shared.module';

@Component({
  selector: 'app-travel-template',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './travel-template.component.html',
  styleUrls: ['./travel-template.component.css']
})
export class TravelTemplateComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private travelService = inject(TravelService);
  private householdService = inject(HouseholdService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  templateItems: TravelTemplateItem[] = [];
  householdId: number = 1;
  selectedCategory: string = 'ALL';
  isLoading = false;

  readonly categories = [
    { label: 'Vêtements', value: 'Clothes' },
    { label: 'Bagage à main', value: 'Carry-on' },
    { label: 'Pharmacie & Soins', value: 'Pharmacy' },
    { label: 'Essentiels & Papiers', value: 'Essentials' },
    { label: 'Autre', value: 'Other' },
  ];

  newItemForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    category: ['Clothes', Validators.required]
  });

  private subscription = new Subscription();

  ngOnInit(): void {
    const currentHh = this.householdService.getCurrentHousehold();
    if (currentHh?.id) {
      this.householdId = currentHh.id;
    }
    this.loadTemplate();

    this.subscription.add(
      this.householdService.retrieveHousehold().subscribe({
        next: (hh) => {
          if (hh?.id && hh.id !== this.householdId) {
            this.householdId = hh.id;
            this.loadTemplate();
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadTemplate(): void {
    this.isLoading = true;
    this.travelService.getTemplate(this.householdId).subscribe({
      next: (items) => {
        this.templateItems = items || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur chargement modèle travel:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger le modèle de voyage.'
        });
      }
    });
  }

  addItem(): void {
    if (this.newItemForm.invalid) {
      this.newItemForm.markAllAsTouched();
      return;
    }

    const formVal = this.newItemForm.value;
    const newItem: TravelTemplateItem = {
      name: formVal.name.trim(),
      category: formVal.category
    };

    this.travelService.addTemplateItem(this.householdId, newItem).subscribe({
      next: (savedItem) => {
        this.templateItems.push(savedItem);
        this.newItemForm.patchValue({ name: '' });
        this.messageService.add({
          severity: 'success',
          summary: 'Ajouté',
          detail: `"${savedItem.name}" ajouté au modèle.`
        });
      },
      error: (err) => {
        console.error('Erreur ajout modèle travel:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Échec de l\'ajout de l\'article au modèle.'
        });
      }
    });
  }

  confirmDeleteItem(event: Event, itemId: number, itemName: string): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Supprimer "${itemName}" du modèle par défaut ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger p-button-sm font-bold',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm font-bold',
      accept: () => {
        this.travelService.deleteTemplateItem(this.householdId, itemId).subscribe({
          next: () => {
            this.templateItems = this.templateItems.filter(i => i.id !== itemId);
            this.messageService.add({
              severity: 'success',
              summary: 'Supprimé',
              detail: 'Article retiré du modèle.'
            });
          },
          error: (err) => {
            console.error('Erreur suppression modèle:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Échec de la suppression sur le serveur.'
            });
          }
        });
      }
    });
  }

  getCategoryLabel(key: string): string {
    const found = this.categories.find(c => c.value === key);
    return found ? found.label : key;
  }

  get filteredItems(): TravelTemplateItem[] {
    if (this.selectedCategory === 'ALL') return this.templateItems;
    return this.templateItems.filter(i => i.category === this.selectedCategory);
  }
}