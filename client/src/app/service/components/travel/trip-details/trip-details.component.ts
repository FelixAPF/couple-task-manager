import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Trip, TripItem, TravelService } from '../../../services/travel.service';
import { HouseholdService } from '../../../household.service';
import { CountdownTimerComponent } from '../countdown-timer/countdown-timer.component';
import { SharedModule } from '../../../../shared.module';

export interface CategoryMeta {
  key: string;
  label: string;
  icon: string;
  colorClass: string;
}

@Component({
  selector: 'app-trip-details',
  standalone: true,
  imports: [CommonModule, FormsModule, CountdownTimerComponent, SharedModule],
  providers: [MessageService],
  templateUrl: './trip-details.component.html',
  styleUrls: ['./trip-details.component.css']
})
export class TripDetailsComponent implements OnInit {
  @Input() trip!: Trip;
  @Input() householdId: number | null = null;
  @Output() tripUpdated = new EventEmitter<void>();

  private travelService = inject(TravelService);
  private householdService = inject(HouseholdService);
  private messageService = inject(MessageService);

  newItemName: Record<string, string> = {};
  filterMode: 'ALL' | 'UNPACKED' | 'PACKED' = 'ALL';

  readonly categoriesMeta: CategoryMeta[] = [
    { key: 'Clothes', label: 'Vêtements', icon: 'pi pi-tag', colorClass: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { key: 'Carry-on', label: 'Bagage à main', icon: 'pi pi-briefcase', colorClass: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    { key: 'Pharmacy', label: 'Pharmacie & Soins', icon: 'pi pi-heart', colorClass: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    { key: 'Essentials', label: 'Essentiels & Papiers', icon: 'pi pi-star', colorClass: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { key: 'Other', label: 'Autre', icon: 'pi pi-box', colorClass: 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300' }
  ];

  ngOnInit(): void {
    if (!this.householdId) {
      const currentHh = this.householdService.getCurrentHousehold();
      if (currentHh?.id) {
        this.householdId = currentHh.id;
      } else {
        this.householdService.retrieveHousehold().subscribe(hh => {
          if (hh?.id) this.householdId = hh.id;
        });
      }
    }
    this.categoriesMeta.forEach(c => this.newItemName[c.key] = '');
  }

  get effectiveHouseholdId(): number {
    return this.householdId || this.householdService.getCurrentHousehold()?.id || 1;
  }

  get totalItemsCount(): number {
    return this.trip?.items?.length || 0;
  }

  get packedItemsCount(): number {
    return this.trip?.items ? this.trip.items.filter(i => i.packed).length : 0;
  }

  get progressPercentage(): number {
    if (this.totalItemsCount === 0) return 0;
    return Math.round((this.packedItemsCount / this.totalItemsCount) * 100);
  }

  adjustQuantity(item: TripItem, delta: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    const currentQty = item.quantity != null && !isNaN(item.quantity) ? item.quantity : 1;
    const nextQty = currentQty + delta;
    if (nextQty < 1) return;

    // Mise à jour optimiste immédiate dans l'UI
    item.quantity = nextQty;

    // Envoi des attributs complets pour préserver l'état packed
    const payload: Partial<TripItem> = {
      name: item.name,
      category: item.category,
      quantity: nextQty,
      packed: item.packed,
      included: item.included ?? true
    };

    this.travelService.updateTripItem(this.effectiveHouseholdId, this.trip.id, item.id, payload).subscribe({
      next: (updated) => {
        if (updated && updated.quantity !== undefined) {
          item.quantity = updated.quantity;
        }
        this.tripUpdated.emit();
      },
      error: (err) => {
        console.error('Erreur mise à jour quantité:', err);
        item.quantity = currentQty;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de modifier la quantité.' });
      }
    });
  }

  togglePacked(item: TripItem): void {
    item.packed = !item.packed;

    const payload: Partial<TripItem> = {
      name: item.name,
      category: item.category,
      quantity: item.quantity || 1,
      packed: item.packed,
      included: item.included ?? true
    };

    this.travelService.updateTripItem(this.effectiveHouseholdId, this.trip.id, item.id, payload).subscribe({
      next: () => this.tripUpdated.emit(),
      error: () => {
        item.packed = !item.packed;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la mise à jour.' });
      }
    });
  }

  addNewItem(categoryKey: string): void {
    const name = this.newItemName[categoryKey]?.trim();
    if (!name) return;

    this.travelService.addTripItem(this.effectiveHouseholdId, this.trip.id, { name, category: categoryKey })
      .subscribe({
        next: (newItem) => {
          if (!newItem.quantity || newItem.quantity < 1) {
            newItem.quantity = 1;
          }
          this.trip.items.push(newItem);
          this.newItemName[categoryKey] = '';
          this.tripUpdated.emit();
          this.messageService.add({ severity: 'success', summary: 'Ajouté', detail: `"${newItem.name}" ajouté.` });
        },
        error: (err) => {
          console.error('Erreur ajout article:', err);
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de l\'ajout de l\'article.' });
        }
      });
  }

  removeItem(item: TripItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.travelService.deleteTripItem(this.effectiveHouseholdId, this.trip.id, item.id)
      .subscribe({
        next: () => {
          this.trip.items = this.trip.items.filter(i => i.id !== item.id);
          this.tripUpdated.emit();
        }
      });
  }

  getItemsByCategory(categoryKey: string): TripItem[] {
    if (!this.trip?.items) return [];
    return this.trip.items.filter(item => {
      const matchCat = item.category === categoryKey;
      if (!matchCat) return false;
      if (this.filterMode === 'UNPACKED') return !item.packed;
      if (this.filterMode === 'PACKED') return item.packed;
      return true;
    });
  }
}