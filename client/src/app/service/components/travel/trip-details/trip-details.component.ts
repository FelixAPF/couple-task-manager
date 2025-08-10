import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Trip, TripItem, TravelService } from '../../../services/travel.service';

// PrimeNG Imports
import { InputSwitchModule } from 'primeng/inputswitch';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CountdownTimerComponent } from '../countdown-timer/countdown-timer.component';
import { SharedModule } from '../../../../shared.module';

@Component({
  selector: 'app-trip-details',
  imports: [ CommonModule, InputSwitchModule , SharedModule, CountdownTimerComponent, FormsModule, TableModule, CheckboxModule, InputNumberModule, ButtonModule, InputTextModule ],
  templateUrl: './trip-details.component.html'
})
export class TripDetailsComponent implements OnInit {
  @Input() trip!: Trip;
  
  categories: string[] = ['Clothes', 'Carry-on', 'Pharmacy', 'Essentials', 'Other'];
  householdId = 1; // Should be dynamic
  newItemName: { [key: string]: string } = {}; // To hold new item names for each category

  editMode = false;

  constructor(private travelService: TravelService) {}

  ngOnInit(): void {
    this.categories.forEach(cat => this.newItemName[cat] = '');
  }

  // Event handler for checkbox, input, etc. to trigger an update
  onItemUpdate(item: TripItem): void {
    this.travelService.updateTripItem(this.householdId, this.trip.id, item.id, item)
      .subscribe();
  }

  addNewItem(category: string): void {
    const name = this.newItemName[category];
    if (name) {
      this.travelService.addTripItem(this.householdId, this.trip.id, { name, category })
        .subscribe(newItem => {
          this.trip.items.push(newItem);
          this.newItemName[category] = ''; // Clear input
        });
    }
  }

  removeItem(itemToRemove: TripItem): void {
    this.travelService.deleteTripItem(this.householdId, this.trip.id, itemToRemove.id)
      .subscribe(() => {
        this.trip.items = this.trip.items.filter(item => item.id !== itemToRemove.id);
      });
  }

  daysUntil(dateStr: string): number {
    if (!dateStr) return 0;
    const tripDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize time
    const diffTime = tripDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  getItemsByCategory(category: string): TripItem[] {
    if (!this.trip || !this.trip.items) {
      return [];
    }
    return this.trip.items.filter(item => item.category === category);
  }
}