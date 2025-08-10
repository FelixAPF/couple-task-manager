import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TravelService, Trip } from '../../../services/travel.service'
import { TripDetailsComponent } from '../trip-details/trip-details.component';

// PrimeNG Modules
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { SharedModule } from '../../../../shared.module';
import { PanelModule } from 'primeng/panel';

@Component({
  selector: 'app-trip-list',
  imports: [
    CommonModule,
    FormsModule,
    TripDetailsComponent,
    // PrimeNG
    DialogModule,
    ButtonModule,
    InputTextModule,
    CalendarModule,
    SharedModule,
    PanelModule
  ],
  templateUrl: './trip-list.component.html',
})
export class TripListComponent implements OnInit {
  trips: Trip[] = [];
  householdId = 1; // Should be dynamic
  selectedTrip: Trip | null = null;
  
  // Controls PrimeNG Dialog visibility
  displayCreateTripModal = false;

  constructor(private travelService: TravelService) {}

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.travelService.getTrips(this.householdId).subscribe(data => {
      this.trips = data;
    });
  }

  showCreateTripDialog(): void {
    this.displayCreateTripModal = true;
  }

  createTrip(formValue: { destination: string; departureDate: string }): void {
    if (!formValue.destination || !formValue.departureDate) {
      return; // Basic validation
    }
    this.travelService.createTrip(this.householdId, formValue.destination, formValue.departureDate)
      .subscribe(newTrip => {
        this.trips.unshift(newTrip);
        this.displayCreateTripModal = false; // Close dialog
      });
  }

  selectTrip(trip: Trip): void {
    this.selectedTrip = trip;
  }

  // Helper to calculate days until a trip
  daysUntil(dateStr: string): number {
    if (!dateStr) return 0;
    const tripDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize time
    const diffTime = tripDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }
}