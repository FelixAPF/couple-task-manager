import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { TravelService, Trip } from '../../../services/travel.service';
import { HouseholdService } from '../../../household.service';
import { TripDetailsComponent } from '../trip-details/trip-details.component';
import { SharedModule } from '../../../../shared.module';

export interface TripTiming {
  state: 'upcoming' | 'today' | 'past';
  days: number;
}

@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TripDetailsComponent, SharedModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './trip-list.component.html',
  styleUrls: ['./trip-list.component.css']
})
export class TripListComponent implements OnInit, OnDestroy {
  private travelService = inject(TravelService);
  private householdService = inject(HouseholdService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);

  trips: Trip[] = [];
  householdId: number = 1;
  selectedTrip: Trip | null = null;
  displayCreateTripModal = false;
  isLoading = false;

  tripForm: FormGroup = this.fb.group({
    destination: ['', [Validators.required, Validators.minLength(2)]],
    departureDate: [null, [Validators.required]]
  });

  private subscription = new Subscription();

  ngOnInit(): void {
    const currentHh = this.householdService.getCurrentHousehold();
    if (currentHh?.id) {
      this.householdId = currentHh.id;
    }
    this.loadTrips();

    this.subscription.add(
      this.householdService.retrieveHousehold().subscribe({
        next: (hh) => {
          if (hh?.id && hh.id !== this.householdId) {
            this.householdId = hh.id;
            this.loadTrips();
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadTrips(): void {
    this.isLoading = true;
    this.travelService.getTrips(this.householdId).subscribe({
      next: (data) => {
        this.trips = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur chargement voyages:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de récupérer vos voyages.'
        });
      }
    });
  }

  openCreateDialog(): void {
    this.tripForm.reset();
    this.displayCreateTripModal = true;
  }

  createTrip(): void {
    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();
      return;
    }

    const formVal = this.tripForm.value;
    const formattedDate = this.formatDateToIso(formVal.departureDate);

    this.travelService.createTrip(this.householdId, formVal.destination.trim(), formattedDate).subscribe({
      next: (newTrip) => {
        if (!newTrip.items) newTrip.items = [];
        this.trips.unshift(newTrip);
        this.displayCreateTripModal = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Voyage créé',
          detail: `Destination : ${newTrip.destination}`
        });
      },
      error: (err) => {
        console.error('Erreur création voyage:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Échec de la création du voyage.'
        });
      }
    });
  }

  private formatDateToIso(dateInput: any): string {
    if (!dateInput) return '';
    if (typeof dateInput === 'string') {
      return dateInput.split('T')[0];
    }
    const d = new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  confirmDeleteTrip(event: Event, trip: Trip): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Voulez-vous supprimer le voyage vers "${trip.destination}" et tous ses éléments ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger p-button-sm font-bold',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm font-bold',
      accept: () => {
        this.travelService.deleteTrip(this.householdId, trip.id).subscribe({
          next: () => {
            this.trips = this.trips.filter(t => t.id !== trip.id);
            if (this.selectedTrip?.id === trip.id) this.selectedTrip = null;
            this.messageService.add({ severity: 'success', summary: 'Supprimé', detail: 'Voyage retiré avec succès.' });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la suppression.' });
          }
        });
      }
    });
  }

  getPackedCount(trip: Trip): number {
    return trip.items ? trip.items.filter(i => i.packed).length : 0;
  }

  getProgressPercent(trip: Trip): number {
    if (!trip.items || trip.items.length === 0) return 0;
    return Math.round((this.getPackedCount(trip) / trip.items.length) * 100);
  }

  getTripTiming(dateStr: string): TripTiming {
    if (!dateStr) return { state: 'past', days: 0 };
    const cleanStr = typeof dateStr === 'string' ? dateStr.split('T')[0] : '';
    const [year, month, day] = cleanStr.split('-').map(Number);
    if (!year || !month || !day) return { state: 'past', days: 0 };

    const tripDate = new Date(year, month - 1, day);
    tripDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = tripDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return { state: 'upcoming', days: diffDays };
    } else if (diffDays === 0) {
      return { state: 'today', days: 0 };
    } else {
      return { state: 'past', days: Math.abs(diffDays) };
    }
  }
}